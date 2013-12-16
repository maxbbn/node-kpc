/**
 * Generate by node-kpc
 */
KISSY.add('malldetail/view/main', function (S) {
    return {
        initView: function (el, cfg, holder, callback) {
            var self = this;
            self.init(S.mix({ el: el }, cfg));
            callback(self);
        },
        init: function (cfg) {
            var product = cfg.product, assetsHost = assetsHost || g_config['assetsHost'] || 'http://l.tbcdn.cn';
            S.use('malldetail/sku/setup,dom', function (S, SKU, DOM) {
                product.onLoad([
                    'config',
                    'visitStat'
                ], function (config, visitStat) {
                    config.onBuyEnable = function () {
                        TShop.poc('buyEnable');
                        if (visitStat) {
                            visitStat.pageStatus = visitStat.pageStatus | 1;
                        }
                    };
                    config.onReviewClick = function () {
                        TShop.onMainBody(function (mainBody) {
                            mainBody.switchTab('J_Reviews');
                        });
                    };
                    config.onShopPromotionMore = function () {
                        TShop.onMainBody(function (mainBody) {
                            mainBody.switchTab('description');
                        });
                    };
                    SKU.init(config);
                    S.ready(function () {
                        var urlParams = TShop.getUrlParams();
                        var tabSelected = urlParams.selected || (urlParams.on_comment == 1 || -1 !== location.href.indexOf('rate_detail.htm') ? 'reviews' : '');
                        if (tabSelected) {
                            TShop.onMainBody(function (mainBody) {
                                mainBody.switchTab(tabSelected);
                            });
                        }
                        var child = DOM.get('#detail');
                        function onMainBody() {
                            TShop.onMainBody();
                        }
                        if (child) {
                            for (child = child.nextSibling; child; child = child.nextSibling) {
                                if (child.nodeType != 1) {
                                    continue;
                                }
                                TShop.addLazyCallback(child, onMainBody);
                            }
                        }
                        TShop.addLazyCallback(DOM.get('.col-sub', '#content'), function () {
                            TShop.onLeftSlide();
                        });
                        S.use('malldetail/other/init', function (S, footinit) {
                            footinit.init();
                        });
                        if (g_config.bizTag & 256 || g_config.bizTag & 512) {
                            S.use('malldetail/common/util', function (S, util) {
                                util.loadAssets('apps/tmall/brandsite/1.0/core.js?' + g_config.t, function () {
                                    window.TBS && window.TBS.initWidget();
                                });
                            });
                        } else {
                            S.use('malldetail/dc/dc', function (S, dc) {
                                var wangpuConfig = {
                                        'assetsHost': assetsHost,
                                        'pageType': 'tmalldetail',
                                        'lazyContainers': '#hd'
                                    };
                                if (config && config.itemDO) {
                                    wangpuConfig.isvParams = S.mix({
                                        nickName: config.itemDO.sellerNickName,
                                        userId: config.itemDO.userId,
                                        shopId: '',
                                        itemId: '',
                                        itemNumId: config.itemDO.itemId,
                                        shopStats: config.itemDO.feature,
                                        validatorUrl: config.itemDO.validatorUrl,
                                        templateName: config.itemDO.templateName,
                                        templateId: config.itemDO.templateId
                                    }, config.isv);
                                }
                                dc.init({
                                    needFetchDc: !g_config.noDc && !!config,
                                    wangpuConfig: wangpuConfig,
                                    success: function () {
                                        TShop.poc('dc');
                                        if (visitStat) {
                                            visitStat.pageStatus = visitStat.pageStatus | 4;
                                        }
                                    }
                                });
                            });
                        }
                    });
                });
            });
        }
    };
});
KISSY.add('malldetail/detail', function (S) {
    var doc = document, win = window, g_config = win.g_config, assetsHost = g_config['assetsHost'] || 'http://l.tbcdn.cn', host = win.location.hostname, isDaily = g_config.assetsHost.indexOf('.daily.') != -1, visitStat, samplingVisit;
    return TShop = {
        init: function () {
            S.config({
                combine: true,
                packages: [
                    {
                        name: 'malldetail',
                        ignorePackageNameInUri: true,
                        tag: g_config.t,
                        path: assetsHost + '/g/tm/detail/' + g_config.ver + '/',
                        charset: 'utf-8',
                        combine: true,
                        debug: true
                    },
                    {
                        name: 'wangpu',
                        tag: '20130106',
                        path: assetsHost + (g_config.bizTag & 64 ? '/apps/taesite/platinum/scripts/' : '/p/shop/3.0/'),
                        charset: 'utf-8'
                    },
                    {
                        name: 'bid-module',
                        tag: '20130606',
                        path: assetsHost + '/apps/auctionplatform/',
                        charset: 'gbk'
                    },
                    {
                        name: 'tml/review',
                        ignorePackageNameInUri: true,
                        tag: g_config.t,
                        path: assetsHost + '/g/mui/review/1.0.3',
                        charset: 'utf-8',
                        debug: true
                    }
                ]
            });
            var use = S.use, isAttached = S.Loader.Utils.isAttached;
            S.use = function (name, callback, async) {
                return use.call(S, name, callback, async === undefined ? true : async);
            };
            S.Loader.Utils.isAttached = function (runtime, modNames) {
                S.Loader.Utils.attachModsRecursively(modNames, runtime);
                return isAttached.call(S.Loader.Utils, runtime, modNames);
            };
            S.add('tb-core', function () {
            });
            S.namespace('TShop.mods.SKU', true);
            TB.namespace('Detail');
            var delayInit = false, reg = /test=([0-9a-zA-Z,:\/\(\)]+)/, result, testRoot = win._TM_TestRoot = assetsHost + '/g/tm/detail/test/';
            if (result = reg.exec(location.hash) || reg.exec(location.search)) {
                result = result[1].split(':');
                if (result[1]) {
                    var rootResult = /^(gl)(?:\(([^\)]+)\))?$/.exec(result[0]);
                    if (rootResult) {
                        switch (rootResult[1]) {
                        case 'gl':
                            testRoot = win._TM_TestRoot = 'http://gitlab.alibaba-inc.com/tm/detail/raw/' + (rootResult[2] || 'master') + '/test/';
                            break;
                        }
                    }
                    result[0] = result[1];
                }
                result = result[0].split(',');
                for (var i = 0; i < result.length; i++) {
                    var onLoad;
                    document.write('<script src="' + testRoot + result[i] + '.js"></script>');
                    if (result[i].indexOf('src') >= 0) {
                        document.scripts[document.scripts.length - 1].onload = _init;
                        delayInit = true;
                    }
                }
            }
            function _init() {
                S.use([
                    'ajax',
                    'cookie',
                    'datalazyload',
                    'dom',
                    'event',
                    'node',
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
                    'malldetail/sku/skuTmVip',
                    'malldetail/sku/stock',
                    'malldetail/sku/thumbViewer'
                ], function () {
                    TShop.poc('js1');
                });
                var svRegResult;
                samplingVisit = (svRegResult = /sampling_v=(\d+)/.exec(location.search)) && svRegResult[1] || parseInt(Math.random() * 10000);
                if (samplingVisit % 1 === 0) {
                    visitStat = {
                        pageStatus: 0,
                        focusTime: 0,
                        maxScrollTop: 0,
                        clickCount: 0,
                        validHits: 0
                    };
                }
                if (host.indexOf('.tmall.') != -1) {
                    g_config.domain = host.substr(host.indexOf('.tmall.') + 1);
                } else if (host.indexOf('.taobao.') != -1) {
                    g_config.domain = host.substr(host.indexOf('.taobao.') + 1);
                } else {
                    g_config.domain = doc.domain.split('.').slice(-2).join('.');
                }
                try {
                    doc.domain = g_config.domain;
                } catch (e) {
                }
                ;
                S.use([
                    'event',
                    'dom',
                    'ajax',
                    'malldetail/common/util',
                    'malldetail/data/data',
                    'malldetail/model/product'
                ], function (S, Event, DOM, IO, util, Data, Product) {
                    TShop.mdskipCallback = TShop.mdskipCallback ? TShop.mdskipCallback(Data.setMdskip) : Data.setMdskip;
                    S.use([
                        'imagezoom',
                        'switchable',
                        'flash',
                        'xtemplate',
                        'wangpu/init',
                        'tml/brandbar',
                        'tml/bottombar',
                        'malldetail/body/brand',
                        'malldetail/body/brand.css',
                        'malldetail/dc/dc',
                        'malldetail/other/eventroute',
                        'malldetail/other/init',
                        'malldetail/other/ishare',
                        'malldetail/other/itemDesc',
                        'malldetail/other/focusTime',
                        'malldetail/other/lazy',
                        'malldetail/other/leftSlide',
                        'malldetail/other/mainBody',
                        'malldetail/other/staticMods',
                        'malldetail/sku/skuMsg',
                        'malldetail/sku/stat',
                        'malldetail/tabbar/localData',
                        'malldetail/tabbar/tabbar'
                    ], function () {
                        TShop.poc('js2');
                    });
                    Product.set('visitStat', visitStat);
                    if (visitStat) {
                        Event.on(win, 'load', function () {
                            visitStat.pageStatus = visitStat.pageStatus | 8;
                        });
                        function onScroll(scrollHeight) {
                            visitStat.pageStatus = visitStat.pageStatus | 16;
                            visitStat.maxScrollTop = Math.max(visitStat.maxScrollTop, DOM.scrollTop());
                        }
                        Event.on(doc, 'scroll', onScroll);
                        Event.on(doc, 'click', function (e) {
                            visitStat.clickCount++;
                            if (e && e.target && (S.inArray(e.target.nodeName, [
                                    'A',
                                    'BUTTON',
                                    'INPUT',
                                    'AREA'
                                ]) || DOM.parent(e.target, 'A') || DOM.css(e.target, 'cursor') == 'pointer')) {
                                visitStat.validHits++;
                            }
                        });
                        var lastSecond = parseInt(g_config.startTime / 1000);
                        function onActive() {
                            var second = parseInt(S.now() / 1000);
                            if (second <= lastSecond) {
                                return;
                            }
                            visitStat.focusTime += Math.min(second - lastSecond, 4) * 1000;
                            lastSecond = second;
                        }
                        Event.on(doc, 'scroll click mousedown keydown mousemove', onActive);
                        Event.on(win, 'unload', function () {
                            onScroll();
                            var descEl = DOM.get('#J_Detail'), dctrEl = DOM.get('#J_DcTopRight'), dcbrEl = DOM.get('#J_DcBottomRight');
                            TShop.sendAtpanel('tmalldetail.49.3', {
                                pageStatus: visitStat.pageStatus,
                                unloadTime: S.now() - g_config.startTime,
                                focusTime: visitStat.focusTime || 0,
                                descWidth: descEl ? DOM.width(descEl) : 0,
                                descHeight: descEl ? DOM.height(descEl) : 0,
                                descTop: descEl ? parseInt(DOM.offset(descEl).top) : 0,
                                dctrHeight: dctrEl ? DOM.height(dctrEl) : 0,
                                dctrTop: dctrEl ? parseInt(DOM.offset(dctrEl).top) : 0,
                                dcbrHeight: dctrEl ? DOM.height(dcbrEl) : 0,
                                dcbrTop: dcbrEl ? parseInt(DOM.offset(dcbrEl).top) : 0,
                                maxScrollTop: visitStat.maxScrollTop,
                                clickCount: visitStat.clickCount,
                                validHits: visitStat.validHits,
                                pageWidth: DOM.width(doc),
                                pageHeight: DOM.height(doc),
                                refer: encodeURIComponent(document.referrer || '')
                            });
                        });
                    }
                    Product.onLoad('config', function (config) {
                        var list = [];
                        if (DOM.get('#J_SSLIcon')) {
                            list.push('malldetail/sku/skuFeatureIcon');
                        }
                        if (config.valFlashUrl) {
                            list.push('malldetail/other/flashplayer');
                        }
                        if (config.midyearPromAuciton) {
                            list.push('malldetail/other/middlePromo');
                        }
                        if (config.isMeiz) {
                            list.push('malldetail/meiz/meiz');
                        }
                        if (config.isTmallComboSupport) {
                            list.push('malldetail/sku/areaSeletor');
                            list.push('malldetail/sku/regionSelectPopup');
                            list.push('malldetail/combos/combos');
                        }
                        if (DOM.get('#promote')) {
                            list.push('malldetail/sku/promotion');
                        }
                        if (config.itemDO && config.itemDO.tagPicUrl) {
                            list.push('malldetail/tabbar/tabbarAttr');
                        }
                        if (-1 != win.location.href.indexOf('rate_detail.htm')) {
                            list = list.concat([
                                'tml/review/index',
                                'tml/review/list',
                                'tml/review/css/list.css',
                                'tml/review/css/tag.css',
                                'tml/review/compose',
                                'tml/review/css/compose.css'
                            ]);
                            Product.onLoad([
                                'reviewCount',
                                'reviewList',
                                'reviewTag',
                                'reviewCompose'
                            ]);
                        }
                        S.use(list, function () {
                            TShop.poc('js3');
                        });
                        Product.onLoad(['mdskip'], function () {
                            TShop.poc('mdskip');
                            Product.onLoad('Extension', function () {
                                TShop.poc('extension');
                            });
                            Product.onLoad('reviewCount');
                        });
                        util.loadAssets('s/tb-tracer-min.js?t=20110628');
                        util.loadAssets('cps/trace.js?t=20120618');
                        if (g_config.offlineShop) {
                            util.loadAssets('p/mall/jz/scroll/scroll.js?t=' + g_config.t);
                        }
                        if (g_config.bizTag & 256 || g_config.bizTag & 512) {
                            util.loadAssets('apps/tmall/brandsite/1.0/core.js?t=' + g_config.t);
                        }
                    });
                    TShop.loadView('.j-mdv');
                    S.ready(function () {
                        TShop.loadView('.j-mdv');
                    });
                    S.use('malldetail/view/main', function (S, MainView) {
                        MainView.init({
                            assetsHost: assetsHost,
                            product: Product.instance()
                        });
                    });
                    S.ready(function () {
                        util.initHover();
                        if (!isDaily)
                            S.getScript('http://a.tbcdn.cn/apps/lz/hc.js?v=5');
                    });
                });
            }
            if (!delayInit) {
                _init();
            }
        },
        loadView: function (ele) {
            S.use('dom,malldetail/common/util', function (S, DOM, Util) {
                S.each(DOM.query(ele), function (el) {
                    if (!DOM.attr(el, 'mdv-cls')) {
                        return;
                    }
                    el._mdvLoader = Util.createLoader(function (callback) {
                        var cls = DOM.attr(el, 'mdv-cls'), cfg = DOM.attr(el, 'mdv-cfg');
                        cfg = cfg ? eval('(' + cfg + ')') : {};
                        DOM.attr(el, 'mdv-cls', '');
                        DOM.attr(el, 'mdv-cfg', '');
                        S.use(cls, function (S, Mod) {
                            Mod.initView(el, cfg, TShop, callback);
                        });
                    });
                    TShop.addLazyCallback(el, el._mdvLoader);
                });
            });
        },
        t: function () {
            return g_config.t;
        },
        _sendImage: function (url, params) {
            if (!url)
                return;
            var defaultParams = {
                    catid: TShop.cfg('itemDO').categoryId,
                    itemId: TShop.cfg('itemDO').itemId,
                    pagetype: this.getPageType(),
                    rn: this.getUrlParams('rn'),
                    sellerId: TShop.cfg('itemDO').userId
                };
            var abTestParam = TShop.cfg('detail').abTestParam;
            if (abTestParam) {
                defaultParams.abTestParam = abTestParam;
            }
            this._sendImage = function (url, params) {
                var params = params || {};
                params = S.mix(params, defaultParams, false);
                var n = 'jsFeImage_' + S.guid();
                var c = win[n] = new Image();
                if (url.indexOf('?') == -1) {
                    url += '?' + S.param(params);
                } else {
                    url += '&' + S.param(params);
                }
                c.onload = c.onerror = function () {
                    win[n] = null;
                };
                c.src = url + '&_tm_cache=' + S.now();
                c = null;
            };
            return this._sendImage(url, params);
        },
        getPageType: function () {
            var href = location.href;
            switch (true) {
            case /spu_detail/.test(href):
                return 'spu';
            case /rate_detail/.test(href):
                return 'rate';
            case /meal_detail/.test(href):
                return 'meal';
            default:
                return 'item';
            }
        },
        sendAtpanel: function (file, params) {
            var url = 'http://log.mmstat.com/' + file;
            this._sendImage(url, params);
        },
        sendAcAtpanel: function (file, params) {
            var url = 'http://ac.atpanel.com/' + file;
            this._sendImage(url, params);
        },
        sendImg: function (url) {
            this._sendImage(url);
        },
        sendErr: function (type, params) {
            params = params || {};
            params.type = type;
            this.sendAtpanel('tmalldetail.15.2', params);
        },
        'flush': win.CollectGarbage || function () {
        },
        inBucket: function (pecent) {
            var trackid, bucketCount = 20;
            pecent = parseFloat(pecent, 10);
            var needBucketCount = Math.round(bucketCount * (pecent / 100));
            trackid = S.Cookie.get('t') || '';
            var bucket_id = this.getUrlParams('bucket_id') || '';
            var curBucket_id;
            function hashCode(str) {
                var h = 0, off = 0, i;
                var len = str.length;
                for (i = 0; i < len; i++) {
                    h = 31 * h + str.charCodeAt(off++);
                    if (h > 2147483647 || h < 2147483648) {
                        h = h & 4294967295;
                    }
                }
                return h;
            }
            ;
            function bucket(h, len) {
                return (h & 65535) % len;
            }
            curBucket_id = bucket_id > 0 ? bucket_id : bucket(hashCode(trackid), bucketCount);
            S.log('bucket_id:' + curBucket_id, 'info');
            return curBucket_id <= needBucketCount;
        },
        getUrlParams: function (keyArray) {
            var url = win.location.href.split('?')[1] || '';
            var params = {};
            var arr = {}, i, j;
            url = url.replace(/#.*$/, '').split('&');
            for (i = 0, j = url.length; i < j; i++) {
                var num = url[i].indexOf('=');
                if (num > 0) {
                    var key = decodeURIComponent(url[i].substring(0, num));
                    var val = url[i].substr(num + 1) || '';
                    try {
                        val = decodeURIComponent(val);
                    } catch (ex) {
                    }
                    params[key] = val;
                }
            }
            if (typeof keyArray == 'string') {
                return params[keyArray] || '';
            } else if (S.isArray(keyArray)) {
                for (i = 0, j = keyArray.length; i < j; i++) {
                    var key = keyArray[i];
                    arr[key] = params[key] || '';
                }
                return arr;
            } else {
                return params;
            }
        },
        onLogin: function (callback, config) {
            var loginConfig = S.mix({ 'proxyURL': 'http://' + win.location.host + '/cross/x_cross_iframe.htm?type=minilogin&t=' + TShop.t() }, config);
            S.use('tml/minilogin', function (S, MLogin) {
                MLogin.show(callback, loginConfig);
            });
        },
        addLazyCallback: function () {
            var argu = arguments;
            S.use('malldetail/other/lazy', function (S, lazy) {
                lazy.addCallback.apply(lazy, argu);
            });
        },
        onMainBody: function () {
            var argu = arguments, self = TShop.onMainBody;
            S.use('malldetail/common/util', function (S, Util) {
                if (self != TShop.onMainBody) {
                    return;
                }
                TShop.onMainBody = Util.createLoader(function (callback) {
                    S.use('malldetail/other/mainBody,malldetail/model/product', function (S, mainBody, Product) {
                        function addDescStat(node) {
                            S.use('event', function (S, Event) {
                                Event.delegate(node, 'click', 'img', function (e) {
                                    var target = e.target;
                                    if (!target.src) {
                                        return;
                                    }
                                    S.use('dom', function (S, DOM) {
                                        var a = DOM.parent(target, 'a');
                                        if (!a || !a.href) {
                                            return;
                                        }
                                        var block = DOM.parent(target, node);
                                        TShop.sendAtpanel('tmalldetail.49.2', {
                                            loadedTime: 0,
                                            clickTime: S.now() - g_config.startTime,
                                            imgTop: DOM.offset(target).top,
                                            blockTop: DOM.offset(block).top,
                                            blockId: block.id,
                                            imgUrl: encodeURIComponent(target.src),
                                            linkUrl: encodeURIComponent(a.href)
                                        });
                                    });
                                });
                            });
                        }
                        var reviewConfig = {
                                daily: isDaily,
                                list: {
                                    scoreLoader: function (callback) {
                                        Product.onChange('reviewCount', callback);
                                    }
                                },
                                hasUserLink: g_config.offlineShop ? false : true
                            };
                        if (-1 != win.location.href.indexOf('rate_detail.htm')) {
                            S.mix(reviewConfig, {
                                list: {
                                    listLoader: function (callback) {
                                        Product.onChange('reviewList', callback);
                                    },
                                    tagLoader: function (callback) {
                                        Product.onChange('reviewTag', callback);
                                    }
                                },
                                compose: {
                                    loader: function (callback) {
                                        Product.onChange('reviewCompose', callback);
                                    }
                                }
                            }, true, null, true);
                        }
                        mainBody.init({
                            reviewConfig: reviewConfig,
                            onDescReady: function (itemDesc) {
                                if (visitStat) {
                                    visitStat.pageStatus = visitStat.pageStatus | 2;
                                }
                                if (g_config.offlineShop) {
                                    S.use('event', function (S, Event) {
                                        Event.delegate(itemDesc, 'click', 'a', function (e) {
                                            e.halt();
                                        });
                                    });
                                }
                                if (samplingVisit % 1000 == 0) {
                                    addDescStat(itemDesc);
                                }
                            },
                            product: Product.instance()
                        });
                        if (samplingVisit % 1000 == 0) {
                            addDescStat('#J_DcTopRight');
                            addDescStat('#J_DcBottomRight');
                        }
                        callback(mainBody);
                    });
                });
                TShop.onMainBody.apply(null, argu);
            });
        },
        onLeftSlide: function () {
            var argu = arguments, self = TShop.onLeftSlide;
            S.use('malldetail/common/util', function (S, Util) {
                if (self != TShop.onLeftSlide) {
                    return;
                }
                TShop.onLeftSlide = Util.createLoader(function (callback) {
                    S.use('malldetail/other/leftSlide', function (S, leftSlide) {
                        leftSlide.init({
                            onReviewClick: function () {
                                TShop.onMainBody(function (mainBody) {
                                    mainBody.switchTab('J_Reviews');
                                });
                            }
                        });
                        callback(leftSlide);
                    });
                });
                TShop.onLeftSlide.apply(null, argu);
            });
        },
        loadMdskip: function (initApi) {
            function onMdskip(mdskip) {
                win.onMdskip = null;
                TShop.mdskipCallback = TShop.mdskipCallback ? TShop.mdskipCallback(mdskip, startTime ? S.now - startTime : -1) : function (callback) {
                    callback(mdskip, startTime ? S.now - startTime : -1);
                };
            }
            if (-1 != location.href.indexOf('rate_detail.htm')) {
                onMdskip();
                return;
            }
            var urlParam = TShop.getUrlParams([
                    'ip',
                    'campaignId',
                    'key',
                    'abt',
                    'cat_id',
                    'q',
                    'u_channel'
                ]);
            urlParam.ref = encodeURIComponent(doc.referrer);
            urlParam.brandSiteId = TShop.cfg('itemDO').brandSiteId;
            var strParam = S.param(urlParam), startTime = S.now();
            win.onMdskip = onMdskip;
            S.getScript(initApi + '&callback=onMdskip&' + strParam, { error: onMdskip });
        },
        Setup: function (cfg) {
            S._TMD_Config = cfg;
            S.mix(cfg, { isDaily: isDaily });
            if (cfg.renderReq) {
                new Image().src = cfg.renderSystemServer + '/index.htm?keys=' + encodeURIComponent(cfg.renderReq);
            }
            TShop.loadMdskip(cfg.initApi);
            S.use('malldetail/model/product', function (S, Product) {
                Product.set('config', cfg);
            });
        },
        cfg: function () {
            var oldVal;
            var newVal;
            var arg = arguments;
            var config = S._TMD_Config || {
                    'api': {},
                    'detail': {},
                    'itemDO': {},
                    'tag': {}
                };
            switch (typeof arg[0]) {
            case 'undefined':
                return config;
            case 'string':
                if (arguments.length == 2) {
                    oldVal = config[arg[0]];
                    if (oldVal != arg[1]) {
                        config[arg[0]] = arg[1];
                    }
                } else {
                    return config[arg[0]];
                }
                break;
            case 'object':
                oldVal = {};
                S.each(arg[0], function (v, k) {
                    oldVal[k] = config[k];
                    config[k] = v;
                });
                break;
            }
        },
        poc: function (b) {
            var a = g_config;
            if (a.offlineShop || a.isOfflineShop) {
                return;
            }
            if (a.isSpu) {
                b += '_s';
            }
            (win._poc = win._poc || []).push([
                '_trackCustomTime',
                'tt_' + b,
                new Date().valueOf()
            ]);
        },
        initFoot: function (cfg) {
            S.use('malldetail/model/product', function (S, Product) {
                Product.set('config1', cfg);
            });
        }
    };
});
(function (S) {
    S.use('malldetail/detail', function (S, Detail) {
        Detail.init({});
        if (!window.g_config.offlineShop) {
            TMall.Head.init();
        }
    }, { sync: true });
}(KISSY));