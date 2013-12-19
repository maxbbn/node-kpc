/* *
 * 实现#detail层的View
 * g_config.bizTag
 &1:确定性小图，
 &2:确定性大图非标类，
 &4:非确定性服饰
 &8:右侧看了又看，
 &16:商家列表，
 &64: 店铺新模板
 &256 品牌站
 &512 品牌站二期
 &2048 是否标品
 * @author 游侠
 */
KISSY.add('malldetail/view/main', function(S) {
	return{
		initView:function(el,cfg,holder,callback){
			var self=this;
			self.init(S.mix({
				el:el
			},cfg));
			callback(self);
		},
		init:function(cfg){
			var product=cfg.product,
				assetsHost=assetsHost||g_config['assetsHost'] || 'http://l.tbcdn.cn';
			S.use('malldetail/sku/setup,dom',function(S,SKU,DOM){
				product.onLoad(["config","visitStat"],function(config,visitStat){
					config.onBuyEnable=function(){
						TShop.poc('buyEnable');
						if(visitStat){visitStat.pageStatus=visitStat.pageStatus|1;}
					};
					config.onReviewClick=function(){
						TShop.onMainBody(function(mainBody){
							mainBody.switchTab('J_Reviews');
						});
					};
					config.onShopPromotionMore=function(){
						TShop.onMainBody(function(mainBody){
							mainBody.switchTab('description');
						});
					};
					SKU.init(config);

					S.ready(function(){
						// tab切换
						var urlParams = TShop.getUrlParams();
						var tabSelected = urlParams.selected || ((urlParams.on_comment == 1 || -1 !== location.href.indexOf('rate_detail.htm') )? "reviews":"");
						if (tabSelected) {
							TShop.onMainBody(function(mainBody){mainBody.switchTab(tabSelected);});
						}

						/* 套餐页没有#detail */
						var child = DOM.get("#detail");
						function onMainBody(){TShop.onMainBody();}
						if(child){
							for(child=child.nextSibling;child;child=child.nextSibling)
							{
								if(child.nodeType!=1){continue;}
								TShop.addLazyCallback(child,onMainBody);
							}
						}

						TShop.addLazyCallback(DOM.get(".col-sub","#content"),function(){
							TShop.onLeftSlide();
						});

						S.use('malldetail/other/init',function(S,footinit){
							footinit.init();
						});

						// 以下为临时方案
						// 装修CDN
						if(g_config.bizTag & 256 || g_config.bizTag&512){
							S.use("malldetail/common/util",function(S,util){
								util.loadAssets('apps/tmall/brandsite/1.0/core.js?'+ g_config.t, function(){window.TBS && window.TBS.initWidget()})
							});
						}else{
							S.use('malldetail/dc/dc',function(S,dc){
								var wangpuConfig={
									"assetsHost": assetsHost,   // 前端资源host地址，根据环境而有不同，默认为线上地址
									"pageType": "tmalldetail",                            // 集市detail:cdetail, tmall 详情页: tmalldetail, 评价： rate
									"lazyContainers": "#hd"                         // 装修部分需要图片懒加载的区域，类型：String|HTMLElement|Array
								};

								if(config && config.itemDO)
								{ // isv 统计需要的参数,请要求后端同学提供一下
									wangpuConfig.isvParams=S.mix({
										nickName:     config.itemDO.sellerNickName,
										userId:       config.itemDO.userId,
										shopId:       '',
										itemId:       '',
										itemNumId:    config.itemDO.itemId,
										shopStats:    config.itemDO.feature,
										validatorUrl: config.itemDO.validatorUrl,
										templateName: config.itemDO.templateName,
										templateId:  config.itemDO.templateId
									},config.isv)
								}
								dc.init({
									needFetchDc:(!g_config.noDc && !!config),
									wangpuConfig:wangpuConfig,
									success:function(){
										TShop.poc("dc");
										if(visitStat){visitStat.pageStatus=visitStat.pageStatus|4;}
									}
								});
							});
						}
					})
				});
			})
		}
	}
});

/* *
 * 实现详情页面通用逻辑的模块
 */
KISSY.add('malldetail/detail', function(S) {
	var doc = document, win = window, g_config = win.g_config,
		assetsHost = g_config['assetsHost'] || 'http://l.tbcdn.cn',host = win.location.hostname,
		isDaily = (g_config.assetsHost.indexOf('.daily.')!=-1),
		visitStat,samplingVisit;
	/*****************
	 * 基础方法
	 *****************/
	return TShop={
		init:function(){

			S.config({
				combine:true,    //让模块支持combo
				packages:[
					{
						name:"malldetail",
						ignorePackageNameInUri:true,
						tag:g_config.t,
						path:assetsHost+"/g/tm/detail/"+g_config.ver+"/",
						charset:"utf-8",
						combine:true,
						debug:true
					},
					{
						name:"wangpu",
						tag:"20130106",
						path: assetsHost+ (g_config.bizTag & 64 ? "/apps/taesite/platinum/scripts/" : "/p/shop/3.0/"),       // path因新老店铺而不同，且域名要根据环境而要不同
						charset:"utf-8"
					},
					{
						name:"bid-module",
						tag:"20130606",
						path: assetsHost+ "/apps/auctionplatform/",
						charset:"gbk"
					},
					{
						name:"tml/review",
						ignorePackageNameInUri:true,
						tag:g_config.t,
						path: assetsHost+ "/g/mui/review/1.0.3",
						charset:"utf-8",
						debug:true
					}
				]
			});
			/*强制使用sync模式，并同步attach*/
			var use= S.use,isAttached=S.Loader.Utils.isAttached;
			S.use=function(name,callback,async){return use.call(S,name,callback,async===undefined?true:async)};
			S.Loader.Utils.isAttached=function(runtime, modNames){
				S.Loader.Utils.attachModsRecursively(modNames, runtime);
				return isAttached.call(S.Loader.Utils,runtime, modNames);
			}
			//通过对还没有完全迁移到1.3的外部模块进行配置
			S.add('tb-core', function() {});
			S.namespace('TShop.mods.SKU',true);
			// 添加 Detail 命名空间, 兼容以前的方法回调
			TB.namespace('Detail');

			//加载测试脚本，测试脚本应该比较早执行，才能控制更多内容，通过严格的正则表达式确保安全
			var delayInit=false,reg=/test=([0-9a-zA-Z,:\/\(\)]+)/,result,testRoot=win._TM_TestRoot=assetsHost+"/g/tm/detail/test/";
			if(result=reg.exec(location.hash)||reg.exec(location.search))
			{
				result=result[1].split(":");
				if(result[1])
				{
					var rootResult=/^(gl)(?:\(([^\)]+)\))?$/.exec(result[0]);
					if(rootResult)
					{
						switch(rootResult[1])
						{
							case "gl":
								testRoot=win._TM_TestRoot="http://gitlab.alibaba-inc.com/tm/detail/raw/"+(rootResult[2]||"master")+"/test/";
								break;
						}
					}
					result[0]=result[1];
				}
				result=result[0].split(",");
				for(var i=0;i<result.length;i++)
				{
					var onLoad;
					document.write('<script src="'+testRoot+result[i]+'.js"></script>');
					if(result[i].indexOf("src")>=0){
						document.scripts[document.scripts.length-1].onload=_init;
						delayInit=true;
					}
				}
			}
			function _init(){
			//下面的use将代表第1次combo的文件内容
			S.use([
				'ajax',
				'cookie',
				'datalazyload',
				'dom',
				'event',
				'node',  //后面建议全部使用dom，之后拿掉
				'template',
				'malldetail/cart/cart',
				'malldetail/common/util',
				'malldetail/data/data',
				'malldetail/model/product',
				'malldetail/sku/buylink',
				'malldetail/sku/double11',
				'malldetail/sku/editEntry',
				'malldetail/sku/freight',
				'malldetail/sku/paymethods',
				'malldetail/sku/price',
				'malldetail/sku/productPromotion',
				'malldetail/sku/propertyHandler',
				'malldetail/sku/sellCount',
				'malldetail/sku/serUnified',
				'malldetail/sku/setup',
				'malldetail/sku/shiptime',
				'malldetail/sku/skuAmount',
				'malldetail/sku/skuTmVip',	//这个文件看起来已经失效了，确认后删除吧
				'malldetail/sku/stock',
				'malldetail/sku/thumbViewer'
			],function(){
				TShop.poc("js1");
			});
			//0-9999随机值，用来各种抽样
			//因为抽样可能影响模块加载，因此，尽可能早的定义
			//允许通过sampling_v参数来调试采样
			var svRegResult;
			samplingVisit=((svRegResult=(/sampling_v=(\d+)/.exec(location.search))) && svRegResult[1])||parseInt(Math.random()*10000);
			//本次访问的全局生命周期埋点
			if(samplingVisit%1===0)//暂时全量，根据数据的使用情况找剧孟确定采样比例
			{
				visitStat={
					pageStatus:0,
					focusTime:0,
					maxScrollTop:0,
					clickCount:0,
					validHits:0
				};
			}

			if(host.indexOf('.tmall.') !=-1 ){
				g_config.domain = host.substr(host.indexOf('.tmall.') + 1);
			}else if(host.indexOf('.taobao.') !=-1 ){
				g_config.domain = host.substr(host.indexOf('.taobao.') + 1);
			}else{
				g_config.domain = doc.domain.split('.').slice(-2).join('.');
			}
			try {
				doc.domain = g_config.domain;
			} catch (e) {};

			S.use(['event','dom','ajax','malldetail/common/util','malldetail/data/data','malldetail/model/product'],function(S,Event,DOM,IO,util,Data,Product){
				TShop.mdskipCallback=TShop.mdskipCallback?TShop.mdskipCallback(Data.setMdskip):Data.setMdskip
				//下面的use将代表第2次combo的文件内容
				S.use([
					'imagezoom',
					'switchable',
					'flash',
					'xtemplate',//在head之中使用到了
					'wangpu/init',
					"tml/brandbar",
					"tml/bottombar",
					"malldetail/body/brand",
					"malldetail/body/brand.css",
					"malldetail/dc/dc",
					"malldetail/other/eventroute",
					'malldetail/other/init',
					'malldetail/other/ishare',
					'malldetail/other/itemDesc',
					"malldetail/other/focusTime",
					"malldetail/other/lazy",
					'malldetail/other/leftSlide',
					'malldetail/other/mainBody',
					'malldetail/other/staticMods',
					'malldetail/sku/skuMsg',
					'malldetail/sku/stat',
					"malldetail/tabbar/localData",
					'malldetail/tabbar/tabbar'
				],function(){
					TShop.poc("js2");
				});

				Product.set("visitStat",visitStat);
				if(visitStat)
				{
					//统计页面是否加载完成
					Event.on(win,"load",function(){
						visitStat.pageStatus=visitStat.pageStatus|8;
					});
					//统计用户是否滚动过页面
					function onScroll(scrollHeight){
						visitStat.pageStatus=visitStat.pageStatus|16;
						visitStat.maxScrollTop=Math.max(visitStat.maxScrollTop,DOM.scrollTop());
						//Event.remove(doc,"scroll",onScroll);
					}
					Event.on(doc,"scroll",onScroll);
					Event.on(doc,"click",function(e){
						visitStat.clickCount++;//页面总点击次数
						if(e && e.target &&
							(S.inArray(e.target.nodeName,["A","BUTTON","INPUT","AREA"]) ||  //动作型节点
								DOM.parent(e.target,"A") ||  //如果包含链接
								DOM.css(e.target,"cursor")=="pointer"	//如果鼠标样式是手型
								)){//如果是有效点击
							visitStat.validHits++;
						}
					});
					//统计页面的活动时间
					var lastSecond=parseInt(g_config.startTime/1000);
					function onActive()
					{
						var second=parseInt(S.now()/1000);
						if(second<=lastSecond){return;}
						visitStat.focusTime+=Math.min(second-lastSecond,4)*1000;
						lastSecond=second;
					}
					Event.on(doc,"scroll click mousedown keydown mousemove",onActive);
					//在页面离开时发送统计
					//文档地址（更改代码请同时更新文档）：
					//http://wiki.ued.taobao.net/doku.php?id=team:b2c:f2e:detail:mmstat
					Event.on(win,"unload",function(){
						onScroll();
						var descEl=DOM.get("#J_Detail"),
							dctrEl=DOM.get("#J_DcTopRight"),
							dcbrEl=DOM.get("#J_DcBottomRight");
						TShop.sendAtpanel("tmalldetail.49.3",{
							pageStatus:visitStat.pageStatus,	//代表页面相关状态的枚举值，由以下状态组成：
							//	1:	buyEnable
							//	2:	descLoaded
							//	4:	shopLoaded
							//	8:	onload
							//	16:	scrolled
							unloadTime:S.now()-g_config.startTime,	//从页面开始加载到离开的毫秒数
							focusTime:visitStat.focusTime||0,	//用户在页面上的聚焦时间毫秒数，剔除用户无任何操作的时间，如2000
							descWidth:descEl?DOM.width(descEl):0,	//商品详情区域宽度
							descHeight:descEl?DOM.height(descEl):0,	//商品详情区高度
							descTop:descEl?parseInt(DOM.offset(descEl).top):0,	//商品详情在页面上的垂直位置
							dctrHeight:dctrEl?DOM.height(dctrEl):0,
							dctrTop:dctrEl?parseInt(DOM.offset(dctrEl).top):0,	//商品详情在页面上的垂直位置
							dcbrHeight:dctrEl?DOM.height(dcbrEl):0,
							dcbrTop:dcbrEl?parseInt(DOM.offset(dcbrEl).top):0,	//商品详情在页面上的垂直位置
							maxScrollTop:visitStat.maxScrollTop,
							clickCount:visitStat.clickCount,
							validHits:visitStat.validHits,
							pageWidth:DOM.width(doc),		//页面宽度
							pageHeight:DOM.height(doc),		//页面高度
							refer:encodeURIComponent(document.referrer||"")
						});
					});
				}

				Product.onLoad("config",function(config){
					var list=[];//list数组代表第3次combo的文件内容
					if(DOM.get("#J_SSLIcon")){list.push("malldetail/sku/skuFeatureIcon");}
					if(config.valFlashUrl){list.push("malldetail/other/flashplayer");}
					if(config.midyearPromAuciton){list.push("malldetail/other/middlePromo");}
					if(config.isMeiz){list.push("malldetail/meiz/meiz");}
					if(config.isTmallComboSupport){
						list.push("malldetail/sku/areaSeletor");
						list.push("malldetail/sku/regionSelectPopup");
						list.push("malldetail/combos/combos");
					}
					if(DOM.get("#promote")){list.push("malldetail/sku/promotion");}
					if(config.itemDO && config.itemDO.tagPicUrl){list.push("malldetail/tabbar/tabbarAttr");}
					if(-1 != win.location.href.indexOf('rate_detail.htm') )
					{//预载评价内容
						list=list.concat(["tml/review/index","tml/review/list","tml/review/css/list.css","tml/review/css/tag.css","tml/review/compose","tml/review/css/compose.css"]);
						Product.onLoad(["reviewCount","reviewList","reviewTag","reviewCompose"]);
					}
					S.use(list,function(){
						TShop.poc("js3");
					});

					Product.onLoad(["mdskip"],function(){
						TShop.poc("mdskip");
						Product.onLoad("Extension",function(){
							TShop.poc("extension");
						});
						Product.onLoad("reviewCount");
					});
					util.loadAssets("s/tb-tracer-min.js?t=20110628");
					util.loadAssets("cps/trace.js?t=20120618");
					if(g_config.offlineShop){
						util.loadAssets("p/mall/jz/scroll/scroll.js?t="+g_config.t);
					}
					if(g_config.bizTag & 256 || g_config.bizTag&512){
						util.loadAssets('apps/tmall/brandsite/1.0/core.js?t='+ g_config.t);
					}

				});

				TShop.loadView(".j-mdv");
				S.ready(function(){TShop.loadView(".j-mdv");});

				S.use("malldetail/view/main",function(S,MainView){
					MainView.init({
						assetsHost:assetsHost,
						product:Product.instance()
					});
				});

				S.ready(function(){
					util.initHover();
					if(!isDaily)S.getScript("http://a.tbcdn.cn/apps/lz/hc.js?v=5");//因为combo文件的格式问题，这个文件不能用loadAssets方式combo
				})
			});
			}
			if(!delayInit){_init();}
		},
		loadView:function(ele)
		{
			S.use("dom,malldetail/common/util",function(S,DOM,Util){
				S.each(DOM.query(ele),function(el){
					if(!DOM.attr(el,"mdv-cls")){return;}
					el._mdvLoader=Util.createLoader(function(callback){
						var cls=DOM.attr(el,"mdv-cls"),
							cfg=DOM.attr(el,"mdv-cfg");
						cfg=cfg?eval("("+cfg+")"):{};
						DOM.attr(el,"mdv-cls","");
						DOM.attr(el,"mdv-cfg","");
						S.use(cls,function(S,Mod){
							Mod.initView(el,cfg,TShop,callback);
						});
					});
					TShop.addLazyCallback(el,el._mdvLoader);
				})
			})
		},
		t :function(){
			return g_config.t;
		},
		/**
		 * 黄金令箭版统计
		 * params为key->value对象
		 * rn为搜索方需求，取自URL，需求方：百陵 2012.9
		 * */
		_sendImage :function(url, params){

			if(!url) return;

			var defaultParams = {
				catid : TShop.cfg("itemDO").categoryId,
				itemId :  TShop.cfg("itemDO").itemId,
				pagetype : this.getPageType(),
				rn : this.getUrlParams('rn'),
				sellerId: TShop.cfg("itemDO").userId
			}
			var abTestParam=TShop.cfg("detail").abTestParam
			if(abTestParam)
			{
				defaultParams.abTestParam=abTestParam;
			}

			this._sendImage = function(url, params){
				var params = params || {};
				params = S.mix(params, defaultParams, false);
				var n = 'jsFeImage_'+ S.guid();
				var c = win[n] = new Image();

				if(url.indexOf('?') == -1){
					url += "?"+S.param(params)
				}else{
					url += "&"+S.param(params)
				}

				c.onload = (c.onerror=function(){win[n] = null;});
				c.src = url+"&_tm_cache="+S.now();
				c = null;
			};
			return this._sendImage(url, params);
		},

		getPageType:function(){
			var href=location.href;
			switch(true){
				case (/spu_detail/.test(href)):
					return "spu";
				case (/rate_detail/.test(href)):
					return "rate";
				case (/meal_detail/.test(href)):
					return "meal";
				default:
					return "item";
			}
		},

		sendAtpanel:function(file,params){
			var url = 'http://log.mmstat.com/'+ file;
			this._sendImage(url, params);
		},

		/**
		 * 暴光统计
		 * params为key->value对象
		 * */
		sendAcAtpanel:function(file,params){
			var url = 'http://ac.atpanel.com/'+ file;
			this._sendImage(url, params);
		},

		sendImg:function(url){
			this._sendImage(url);
		},

		sendErr:function(type,params){
			params = params||{};
			params.type = type;
			this.sendAtpanel("tmalldetail.15.2",params);
		},

		"flush" : (win.CollectGarbage || (function() {})),


		/**
		 * 用户分桶：实际上只是控制概率，与真实的桶号无半毛钱关系
		 * daqiu.lym
		 */
		inBucket:function(pecent){
			var trackid,bucketCount = 20;
			pecent = parseFloat(pecent,10);
			var needBucketCount = Math.round(bucketCount*(pecent/100));
			trackid = S.Cookie.get('t')||"";
			var bucket_id = this.getUrlParams('bucket_id')||"";
			var curBucket_id;

			function hashCode(str){
				var h = 0, off = 0,i;
				var len = str.length;
				for(i = 0; i < len; i++){
					h = 31 * h  + str.charCodeAt(off++);
					if(h > 0x7fffffff || h < 0x80000000){
						h = h & 0xffffffff;
					}
				}
				return h;
			};

			function bucket(h,len){
				return (h&0xffff)%len;
			}

			//优先使用URL上的bucket_id
			curBucket_id = (bucket_id > 0)? bucket_id : bucket(hashCode(trackid), bucketCount);

			S.log('bucket_id:'+curBucket_id,'info');

			return curBucket_id <= needBucketCount;
		},

		/**
		 * 获取URL上指定参数,没有decodeURIComponent
		 * e.g. http://xx?a=2&b=3
		 * getUrlParams([k]),return  {k:v}
		 * getUrlParams(k),return  v
		 */
		getUrlParams: function (keyArray){
			var url = win.location.href.split('?')[1] || "";
			var params = {};
			var arr = {},i,j;
			//URL带#情况
			url = url.replace(/#.*$/,'').split("&");

			for(i=0,j=url.length;i<j;i++){
				var num = url[i].indexOf("=");
				if (num>0){
					var key = decodeURIComponent(url[i].substring(0, num));
					var val = url[i].substr(num + 1)||"";
					try {
						val = decodeURIComponent(val);
					}catch (ex) {
					}
					params[key] = val;
				}
			}

			if(typeof keyArray == 'string'){
				return params[keyArray]||"";
			}else if(S.isArray(keyArray)){
				for(i=0,j=keyArray.length;i<j;i++){
					var key = keyArray[i];
					arr[key] = params[key]||"";
				}
				return arr;
			}else{
				return params;
			}
		},

		/**
		 * 包一层minilogin，不敢直接依赖用购物袋S.minilogin
		 */
		onLogin: function(callback, config) {
			var loginConfig = S.mix({
				"proxyURL":"http://"+ win.location.host +"/cross/x_cross_iframe.htm?type=minilogin&t="+TShop.t()
			}, config);
			S.use("tml/minilogin",function(S, MLogin){
				MLogin.show(callback, loginConfig);
			});
		},
		addLazyCallback:function(){
			var argu=arguments;
			S.use("malldetail/other/lazy",function(S,lazy){
				lazy.addCallback.apply(lazy,argu);
			});
		},
		onMainBody:function(){
			var argu=arguments,self=TShop.onMainBody;
			S.use("malldetail/common/util",function(S,Util){
				if(self!=TShop.onMainBody){return;}
				TShop.onMainBody=Util.createLoader(function(callback){
					S.use("malldetail/other/mainBody,malldetail/model/product",function(S,mainBody,Product){
						function addDescStat(node)
						{//图片点击统计函数
							S.use("event",function(S,Event){
								Event.delegate(node,"click","img",function(e){
									var target=e.target;
									if(!target.src){return;}
									S.use("dom",function(S,DOM){
										var a=DOM.parent(target,"a");
										if(!a||!a.href){return;}
										var block=DOM.parent(target,node);
										TShop.sendAtpanel("tmalldetail.49.2",{
											loadedTime:0,	//从页面开始加载到该图片加载完成的毫秒数，如240,目前无法统计，忽略
											clickTime:S.now()-g_config.startTime,	//从页面开始加载到该次点击的毫秒数，如260
											imgTop:DOM.offset(target).top,
											blockTop:DOM.offset(block).top,
											blockId:block.id,	//图片所在区块的ID
											imgUrl:encodeURIComponent(target.src),	//图片的URL地址
											linkUrl:encodeURIComponent(a.href)	//链接的地址
										});
									})
								});
							})
						}
						var reviewConfig = {
							daily:isDaily,
							list:{
								scoreLoader:function(callback){Product.onChange("reviewCount",callback)}
							},
							hasUserLink:(g_config.offlineShop?false:true)
						}
						if(-1 != win.location.href.indexOf('rate_detail.htm') )
						{
							S.mix(reviewConfig,{
								list:{
									listLoader:function(callback){Product.onChange("reviewList",callback)},
									tagLoader:function(callback){Product.onChange("reviewTag",callback)}
								},
								compose:{
									loader: function(callback){Product.onChange("reviewCompose",callback)}
								}
							}, true, null , true);
						}
						mainBody.init({
							reviewConfig:reviewConfig,
							onDescReady:function(itemDesc){
								if(visitStat){visitStat.pageStatus=visitStat.pageStatus|2;}
								if(g_config.offlineShop){
									S.use("event",function(S,Event){
										Event.delegate(itemDesc,"click","a",function(e){
											e.halt();
										})
									})
								}
								if(samplingVisit%1000==0)
								{//图片点击统计
									addDescStat(itemDesc);
								}
							},
							product:Product.instance()
						});
						if(samplingVisit%1000==0)
						{//图片点击统计
							addDescStat("#J_DcTopRight");
							addDescStat("#J_DcBottomRight");
						}
						callback(mainBody);
					});
				})
				TShop.onMainBody.apply(null,argu);
			});
		},
		onLeftSlide:function(){
			var argu=arguments,self=TShop.onLeftSlide;
			S.use("malldetail/common/util",function(S,Util){
				if(self!=TShop.onLeftSlide){return;}
				TShop.onLeftSlide=Util.createLoader(function(callback){
					S.use("malldetail/other/leftSlide",function(S,leftSlide){
						leftSlide.init({
							onReviewClick:function(){
								TShop.onMainBody(function(mainBody){
									mainBody.switchTab('J_Reviews');
								});
							}
						});
						callback(leftSlide);
					});
				})
				TShop.onLeftSlide.apply(null,argu);
			});
		},
		loadMdskip:function(initApi)
		{
			function onMdskip(mdskip){
				win.onMdskip=null;
				TShop.mdskipCallback=TShop.mdskipCallback?TShop.mdskipCallback(mdskip,startTime?(S.now-startTime):-1):function(callback){callback(mdskip,startTime?(S.now-startTime):-1);}
			}
			if(-1 != location.href.indexOf('rate_detail.htm')){
				onMdskip();//写评价页面不需要加载mdskip
				return;
			}
			var urlParam = TShop.getUrlParams(["ip","campaignId","key","abt","cat_id","q","u_channel"]);
			urlParam.ref = encodeURIComponent(doc.referrer);
			urlParam.brandSiteId = TShop.cfg("itemDO").brandSiteId;
			var strParam=S.param(urlParam),startTime=S.now();
			win.onMdskip=onMdskip;
			S.getScript(initApi+"&callback=onMdskip&"+strParam,{error:onMdskip})
		},
		//原SKU.Setup
		Setup:function(cfg){
			S._TMD_Config = cfg;
			S.mix(cfg,{isDaily : isDaily});

			if(cfg.renderReq){
				new Image().src=cfg.renderSystemServer+"/index.htm?keys="+encodeURIComponent(cfg.renderReq);
			}
			//预载mdskip的内容
			TShop.loadMdskip(cfg.initApi);
			S.use("malldetail/model/product",function(S,Product){
				Product.set("config",cfg);
			});
		},

		/*
		 设置&获取config 2012.3.10 daqiu
		 TShop.cfg() 获取整个config
		 TShop.cfg(k,v) 设置config[k] = v
		 TShop.cfg(k) 获取config[k]
		 TShop.cfg({k1:v1,k2:v2..}) 设置多个k
		 事件抛出{oldVal:,newVal:}
		 */
		cfg: function (){
			var oldVal;
			var newVal;
			var arg = arguments;
			var config = S._TMD_Config || {
				"api":{},
				"detail":{},
				"itemDO":{},
				"tag":{}
			};

			switch(typeof arg[0]){
				case 'undefined'://get whole Config
					return config;
				case 'string':
					if(arguments.length == 2){//setConfig 未作KEY校验
						oldVal = config[arg[0]];
						if(oldVal != arg[1]){
							config[arg[0]] = arg[1];
						}

					}else{//getConfig
						return config[arg[0]];
					}
					break;
				case 'object'://setConfig{k:v},未作KEY校验
					oldVal= {};
					S.each(arg[0],function(v,k){
						oldVal[k] = config[k];
						config[k] = v;
					});
					break;
			}
		},
		poc:function(b)
		{
			var a=g_config;
			if(a.offlineShop || a.isOfflineShop){return}
			if(a.isSpu){b+="_s"}
			(win._poc=win._poc||[]).push(["_trackCustomTime","tt_"+b,new Date().valueOf()])
		},
		initFoot:function(cfg)
		{
			S.use("malldetail/model/product",function(S,Product){
				Product.set("config1",cfg);
			});
		}
	}
});

/* *
 * detail页面的入口
 * @author 游侠
 */
(function(S) {
	S.use("malldetail/detail",function(S,Detail){
		//detail页面可以全部使用默认参数
		//其他应用如商超等可以通过下面的参数来配置
		Detail.init({});
		//页头开始
		if(!window.g_config.offlineShop){
			TMall.Head.init();
		}
	},{sync:true})
})(KISSY);