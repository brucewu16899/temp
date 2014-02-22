/*
    ���ܣ�
        �� TABLE ����ʽ����һ�� Tree��ÿ�� TR ��ʾһ���ڵ㣩���������䶯̬��ʾ��

    ���ԣ�
        o ���ַ�ʽ���� Tree��Ҳ���Խ��ʹ��
            ����̬���� - �������ݵĶ��壬��̬���� tree ��ʵ��ṹ
            ����̬���� - ���Ѿ����ڵ� TABLE �����Ϊ tree
        o ÿ���ڵ���Դ�һ���Զ������ݣ�custom data�������� StaticTree��custom data ֻ�����ַ���
        o ������ skin ��ʽ���ƽ�����
            ��Ŀǰ�ṩ���� skin��PureSkin��CharSkin��ImageSkin
        o ÿ���ڵ��С����⣨caption������������չ����ext������ʹ��
        o ����ͨ�� TR.setIcon() �趨�ڵ��е�ͼ�꣬��������ã������� skin �ṩ��ȱʡͼ��
        o �ṩ TR.highlight() �� TABLE.unhighlight() ����������
        o ָ��Ϊ hot �Ľڵ㣬�����ڷ�֧��ȫ��������ʾ����ȱʡչ��
        o TBD��to be download������
            ��ָ��Ϊ TBD �Ľڵ㣬��չ��ʱ�������� download ����������������֧�µ�����
            �������ɶ��Ƶ� onDownloadDone �����ӿڣ�TABLE ���� TR ����
            ���������ʧ�ܣ����Ե�����������ء�

    TODO��
        o getLastChildRowIndex() �ļ��㷽�������� childItems.sort()�����Կ����Ż�
*/

var N_ITEM_COLLAPSED = 0;
var N_ITEM_EXPANDED  = 1;
var N_ITEM_TBD       = 2; // To Be Download
var N_ITEM_LEAF      = 3;
var N_ITEM_NOTICE    = 4;
var N_ITEM_DOWNLOADER= 5;

function TreeBuilder() {
    // ��̬����һ�� Tree
    this.createTree = TreeBuilder_createTree;
    function TreeBuilder_createTree() {
        var oTABLE = document.createElement("TABLE");
        var oTBODY = document.createElement("TBODY");
        oTABLE.insertAdjacentElement("beforeEnd", oTBODY);
        oTABLE.cellSpacing = 0;
        oTABLE.cellPadding = 0;

        oTABLE.theBody = oTBODY;
        oTABLE.parentItem = null;  // ����һ����־����ʾ������ĸ��ڵ�
        oTABLE.childItems = new Array();
        oTABLE.skin = new ImageSkin();

        oTABLE.appendItem = TreeBuilder_appendItem;
        oTABLE.finish = TreeBuilder_finish;
        oTABLE.unhighlight = TreeBuilder_unhighlight;
        oTABLE.onDownloadDone = null;

        return oTABLE;
    }

    // ��һ���Ѿ����ڵ� TABLE �����Ϊ Tree
    // ����������ǣ����� lv ���Ե� TR ��������Ϊ���ڵ��С�����
    this.rebuildTree = TreeBuilder_rebuildTree;
    function TreeBuilder_rebuildTree(oTABLE, skin) {
        if (typeof(skin) == "undefined") skin = new ImageSkin();

        oTABLE.theBody = oTABLE.tBodies(0);
        oTABLE.parentItem = null;  // ����һ����־����ʾ������ĸ��ڵ�
        oTABLE.childItems = new Array();
        oTABLE.skin = skin;

        oTABLE.appendItem = TreeBuilder_appendItem;
        oTABLE.finish = TreeBuilder_finish;
        oTABLE.unhighlight = TreeBuilder_unhighlight;
        oTABLE.onDownloadDone = null;

        var oPrevItem = null;
        for (var i=0; i < oTABLE.rows.length; i++) {
            if (typeof(oTABLE.rows(i).lv) != "undefined") {
                var itemdata = new TreeItemData(0, "", false, "", null);
                var oTR = itemdata.rebuildItem(oTABLE.rows(i));

                if (oPrevItem == null) {
                    // ���� TABLE �еĵ�һ�����ڵ��С�
                    oTR.setParentTo(oTABLE);
                } else {
                    // �ҵ������𲻵��ڱ��ڵ㡱�Ľڵ�
                    while (oPrevItem.lv > oTR.lv) {
                        oPrevItem = oPrevItem.parentItem;
                    }
                    if (oTR.lv == oPrevItem.lv) {
                        // �ҵ��� oPrevItem �� oTR ���ֵܽڵ�
                        oTR.setParentTo(oPrevItem.parentItem);
                    } else {
                        // �ҵ��� oPrevItem �� oTR �ĸ��ڵ�
                        oTR.setParentTo(oPrevItem);
                    }
                }

                oPrevItem = oTABLE.rows(i);
            }
        }

        oTABLE.childItems.sort(CompareChildOrder);
        for (var i=0; i<oTABLE.childItems.length; i++) {
            oTABLE.childItems[i].showItemRecursive(true);
        }
    }

    // ����һ���µġ��ڵ��С�����
    function TreeBuilder_appendItem(itemdata) {
        // this ��һ����TABLE������

        // �����ڵ��ж���
        var oTR = itemdata.renderItem(this);

        // �Ѹö�����ӵ� Tree �����һ��
        this.theBody.insertAdjacentElement("beforeEnd", oTR);

        // �Ѹö���ҽӵ����ʵĸ��ڵ�

        // �� TABLE ���ҵ���һ�����ڵ��С�
        var oPrevItem = null;
        FindPrevItem: {
            for (var i=oTR.rowIndex-1; i>=0; i--) {
                if (typeof(this.rows(i).lv) != "undefined") {
                    oPrevItem = this.rows(i);
                    break FindPrevItem;
                }
            }
            // ���û���ҵ���˵������һ���µĶ����ڵ�
            oTR.setParentTo(this);
            return oTR;
        }

        // �ҵ������𲻵��ڱ��ڵ㡱�Ľڵ�
        while (oPrevItem.lv > oTR.lv) {
            oPrevItem = oPrevItem.parentItem;
        }
        if (oTR.lv == oPrevItem.lv) {
            // �ҵ��� oItem �� oTR ���ֵܽڵ�
            oTR.setParentTo(oPrevItem.parentItem);
        } else {
            // �ҵ��� oItem �� oTR �ĸ��ڵ�
            oTR.setParentTo(oPrevItem);
        }
        return oTR;
    }

    // ������̬ Tree �Ĺ�����ˢ����ʾ
    function TreeBuilder_finish() {
        // this ��һ����TABLE������

        this.childItems.sort(CompareChildOrder);
        for (var i=0; i<this.childItems.length; i++) {
            this.childItems[i].showItemRecursive(true);
        }
    }

    // �����нڵ��е���ɫ�ָ�����׼״̬
    function TreeBuilder_unhighlight() {
        // this ��һ����TABLE������

        for (var i = 0; i < this.rows.length; i++) {
            if (typeof(this.rows(i).highlight) == "function") {
                this.rows(i).highlight(null);
            }
        }
    }
}

function TreeItemData(level, text, hot, dlurl, cdata) {
    this.level = level;
    this.text = text;
    this.hot = (hot == true) ? true : false; // ȱʡ���� false
    this.dlurl = (typeof(dlurl) == "string" && dlurl != "") ? dlurl : null;

    this.cdata = (typeof(cdata) == "undefined") ? null : cdata;

/*
    ÿ�����ڵ��С�������Զ��������У�
       lv           - �����ļ��Σ�0,1,2...��������ֻ�ڳ�ʼ��ʱʹ�ã����ڷ������ͽṹ
       hot          - �ڵ��Ƿ�Ϊ hot��hot �ͽڵ����ڵķ�֧����ȫ��������ʾ��������ֻ�ڳ�ʼ��ʱʹ��
       dlurl        - N_ITEM_TBD �͵Ľڵ��������ص���ַ
       cdata        - ������ custom data
       st           - �ڵ�ĵ�ǰ״̬����ƽڵ����ͣ���N_ITEM_COLLAPSED / N_ITEM_EXPANDED / N_ITEM_TBD / N_ITEM_LEAF / N_ITEM_NOTICE / N_ITEM_DOWNLOADER
       hicolor      - highlight ����ɫ����Ϊ null����ʹ��ȱʡ��ɫ
       iconstr      - ���Ƶ� ICON����Ϊ null��������ȱʡͼ��
       skin         - �� TABLE �̳й����� skin ����
       parentItem   - ���ڵ���󡣶����ڵ�� parentItem �� TABLE ����
       childItems   - �����ӽڵ�
       prefix       - ������ʾ��֧���ߵ� SPAN ����
       handle       - ����չ��/�۵�һ����֧�� SPAN ����
       icon         - ������ʾͼ��� SPAN ����
       caption      - ������ʾ�ڵ��������ݵ� SPAN ����
       ext          - ������ʾ��չ���ݵ� SPAN ����
*/

    // ���� TreeItemData������һ�����ڵ��С�����
    this.renderItem = TreeItemData_renderItem;
    function TreeItemData_renderItem(oRef) {
        // this ��һ����TreeItemData������

        // �����ڵ��ж���
        var oTR = document.createElement("TR");
        oTR.lv = this.level;
        oTR.hot = this.hot;
        oTR.dlurl = this.dlurl;
        oTR.cdata = this.cdata;
        oTR.st = N_ITEM_LEAF;
        oTR.hicolor = null;
        oTR.iconstr = null;
        oTR.skin = TreeItemData_getAncestorOfTag(oRef, "TABLE").skin;
        oTR.childItems = new Array();

        var oTD = document.createElement("TD");
        oTR.insertAdjacentElement("beforeEnd", oTD);
        oTD.style.cursor = "default";
        oTD.style.paddingLeft = this.level * oTR.skin.N_INDENT;
        oTD.noWrap = true;
        oTD.innerHTML = "<span></span><span></span><span></span><span></span><span></span>";

        oTR.prefix = oTR.all.tags("SPAN")[0];
        oTR.prefix.style.cssText = oTR.skin.STR_STYLE_PREFIX;

        oTR.handle = oTR.all.tags("SPAN")[1];
        oTR.handle.style.cssText = oTR.skin.STR_STYLE_HANDLE;

        oTR.icon = oTR.all.tags("SPAN")[2];
        oTR.icon.style.cssText = oTR.skin.STR_STYLE_ICON;

        oTR.caption = oTR.all.tags("SPAN")[3];
        oTR.caption.innerHTML = this.text;

        oTR.ext = oTR.all.tags("SPAN")[4];

        oTR.insertBefore = TreeItemData_insertBefore;
        oTR.setParentTo = TreeItemData_setParentTo;
        oTR.showItemRecursive = TreeItemData_showItemRecursive;
        oTR.getLastChildRowIndex = TreeItemData_getLastChildRowIndex;
        oTR.remove = TreeItemData_remove;
        oTR.highlight = TreeItemData_highlight;
        oTR.setIcon = TreeItemData_setIcon;
        oTR.redraw = TreeItemData_redraw;

        return oTR;
    }

    // �� TABLE ��һ���Ѿ����ڵ� TR ����ɡ��ڵ��С�����
    this.rebuildItem = TreeItemData_rebuildItem;
    function TreeItemData_rebuildItem(oItem) {
        // this ��һ����TreeItemData������

        // �����ڵ��ж���
        var oTR = oItem;
        this.level = oTR.lv;
        this.hot = oTR.hot;
        this.dlurl = oTR.dlurl;
        this.cdata = oTR.cdata;
        oTR.st = N_ITEM_LEAF;
        oTR.hicolor = null;
        oTR.iconstr = null;
        oTR.skin = TreeItemData_getAncestorOfTag(oItem, "TABLE").skin;
        oTR.childItems = new Array();

        var oTD = oItem.cells(0);
        this.text = oTD.innerText;
        oTD.style.cursor = "default";
        oTD.style.paddingLeft = this.level * oTR.skin.N_INDENT;
        oTD.noWrap = true;
        oTD.innerHTML = "<span></span><span></span><span></span><span></span><span></span>";

        oTR.prefix = oTR.all.tags("SPAN")[0];
        oTR.prefix.style.cssText = oTR.skin.STR_STYLE_PREFIX;

        oTR.handle = oTR.all.tags("SPAN")[1];
        oTR.handle.style.cssText = oTR.skin.STR_STYLE_HANDLE;

        oTR.icon = oTR.all.tags("SPAN")[2];
        oTR.icon.style.cssText = oTR.skin.STR_STYLE_ICON;

        oTR.caption = oTR.all.tags("SPAN")[3];
        oTR.caption.innerHTML = this.text;

        oTR.ext = oTR.all.tags("SPAN")[4];

        oTR.insertBefore = TreeItemData_insertBefore;
        oTR.setParentTo = TreeItemData_setParentTo;
        oTR.showItemRecursive = TreeItemData_showItemRecursive;
        oTR.getLastChildRowIndex = TreeItemData_getLastChildRowIndex;
        oTR.remove = TreeItemData_remove;
        oTR.highlight = TreeItemData_highlight;
        oTR.setIcon = TreeItemData_setIcon;
        oTR.redraw = TreeItemData_redraw;

        return oTR;
    }

    // ��һ�����ڵ��С�������뵽 TABLE ��һ��ָ���Ľڵ�֮ǰ��ͬʱ�ҽӵ� tree �У���Ϊ�䡰���ڵ㡱
    function TreeItemData_insertBefore(oSibling) {
        // this ��һ�����ڵ��С�����
        oSibling.insertAdjacentElement("beforeBegin", this);
        this.setParentTo(oSibling.parentItem);
    }

    // �� TABLE ���Ѿ����ڵ�һ�����ڵ��С�����ҽӵ�ָ���Ľڵ��£���Ϊ���ӽڵ�
    function TreeItemData_setParentTo(oParentItem) {
        // this ��һ�����ڵ��С�����

        this.parentItem = oParentItem;
        oParentItem.childItems.push(this);

        if (oParentItem.tagName == "TR") {
            if (oParentItem.st == N_ITEM_LEAF || oParentItem.st == N_ITEM_TBD) {
                // ������ڵ�ֻ��һ����Ҷ�ӡ��������� TBD��Ҫ�Ƚ������Ϊһ������֧��
                oParentItem.st = N_ITEM_COLLAPSED;

                oParentItem.handle.style.cssText = this.skin.STR_STYLE_HANDLE;
                oParentItem.handle.onclick = TreeItemData_onClickHandle;
            }
        }

        if (this.hot) {
            // ����ýڵ��ǡ�hot������������һ֧ȫ����Ϊ��hot������ȱʡչ��
            var oItem = this;
            oItem.style.fontWeight = "bold";
            oItem = oItem.parentItem;
            while (oItem.tagName == "TR") {
                oItem.st = N_ITEM_EXPANDED;
                oItem.hot = true;
                oItem.style.fontWeight = "bold";
                oItem = oItem.parentItem;
            }
        }

        if (this.dlurl != null) {
            // ����ýڵ��ǡ�to be download��
            this.st = N_ITEM_TBD;

            this.handle.style.cssText = this.skin.STR_STYLE_HANDLE;
            this.handle.onclick = TreeItemData_onClickHandle;
        }
    }

    // ȡ��һ���ڵ�����һ���ӽڵ�������
    // �������ǰ�������ǣ� childItems ���ʵ�����ģ�
    function TreeItemData_getLastChildRowIndex() {
        // this ��һ�����ڵ��С�����
        var ri = -1;
        if (this.childItems.length > 0) {
            ri = this.childItems[this.childItems.length - 1].rowIndex;
        }
        return ri;
    }

    // ��һ���ڵ㼰�������ӽڵ�� tree ��ժ����ͬʱ�� TABLE ��ɾ��
    function TreeItemData_remove(bFirstCall) {
        // this ��һ�����ڵ��С�����
        bFirstCall = (typeof(bFirstCall) == "undefined") ? true : false;

        // �ݹ�ɾ�����ڵ��µ������ӽڵ�
        while (this.childItems.length > 0) {
            this.childItems[0].remove(false);
        }

        // �ѱ��ڵ�Ӹ��ڵ�� childItems ��ժ��
        var oPrevSibling = null;
        var oParentItem = this.parentItem;
        for (var i=0; i<oParentItem.childItems.length; i++) {
            if (oParentItem.childItems[i] == this) {
                if (i == (oParentItem.childItems.length - 1) && i > 0) {
                    // ������ڵ��ǡ�ô�ܽڵ㡱��Ҫ��¼���䡰���ڸ��ڵ㡱
                    oPrevSibling = oParentItem.childItems[i - 1];
                }
                oParentItem.childItems.splice(i, 1);
                break;
            }
        }

        // �ѱ����ڵ��С��� TABLE ��ɾ��
        this.parentElement.removeChild(this);

        // ������뿪�ݹ���̵�ʱ��ˢ�±��ڵ�ġ����ڸ��ڵ㡱
        if (bFirstCall && oPrevSibling != null) {
            oPrevSibling.showItemRecursive(true);
        }
    }

    // �ݹ鴦��һ���ڵ㼰�����νڵ����ʾ/����
    function TreeItemData_showItemRecursive(bShow) {
        // this ��һ�����ڵ��С�����
        this.style.display = bShow ? "inline" : "none";
        this.redraw();
        if (bShow && this.st == N_ITEM_EXPANDED) {
            // �ݹ鴦�����ε�ÿ����֧
            for (var i=0; i<this.childItems.length; i++) {
                this.childItems[i].showItemRecursive(true);
            }
        } else {
            // ���������еĽڵ㶼���ص�
            for (var i=0; i<this.childItems.length; i++) {
                this.childItems[i].showItemRecursive(false);
            }
        }
    }

    // ���¼��㡰�ڵ��С���������
    function TreeItemData_redraw() {
        // this ��һ�����ڵ��С�����

        // ���� prefix
        var prefix = "";
        var oChildItem = this;
        var oParentItem = oChildItem.parentItem;
        if (oParentItem.tagName == "TR") {
            if (oChildItem.st == N_ITEM_LEAF || oChildItem.st == N_ITEM_NOTICE || oChildItem.st == N_ITEM_DOWNLOADER) {
                // ֻ�зǶ�����Ҷ�ӽڵ㣬�Ż������ prefix ������е����λ����ʾ���� handle��
                if (oChildItem.rowIndex == oParentItem.getLastChildRowIndex())
                    prefix = this.skin.STR_PREFIX_LUR + prefix;
                else
                    prefix = this.skin.STR_PREFIX_LURD + prefix;
            }

            oChildItem = oParentItem;
            oParentItem = oChildItem.parentItem;
        }
        // ����ÿ�������Ƿ�Ϊ��ô�ܡ���������Ӧ�� prefix �����״
        while (oParentItem.tagName == "TR") {
            if (oChildItem.rowIndex == oParentItem.getLastChildRowIndex())
                prefix = this.skin.STR_PREFIX_L + prefix;
            else
                prefix = this.skin.STR_PREFIX_LUD + prefix;

            oChildItem = oParentItem;
            oParentItem = oChildItem.parentItem;
        }
        // ������Ƕ����ڵ㣬��Ҫ������һ�� prefix ��
        if (this.parentItem.tagName == "TR") prefix = this.skin.STR_PREFIX_L + prefix;
        this.prefix.innerHTML = prefix;

        // ���� handle
        var handle = "";
        switch (this.st) {
        case N_ITEM_COLLAPSED:
            if (this.parentItem.tagName == "TR") {
                if (this.rowIndex == this.parentItem.getLastChildRowIndex())
                    handle = this.skin.STR_HANDLE_COL_UR;
                else
                    handle = this.skin.STR_HANDLE_COL_URD;
            } else {
                handle = this.skin.STR_HANDLE_COL_R;
            }
            break;

        case N_ITEM_EXPANDED:
            if (this.parentItem.tagName == "TR") {
                if (this.rowIndex == this.parentItem.getLastChildRowIndex())
                    handle = this.skin.STR_HANDLE_EXP_UR;
                else
                    handle = this.skin.STR_HANDLE_EXP_URD;
            } else {
                handle = this.skin.STR_HANDLE_EXP_R;
            }
            break;

        case N_ITEM_TBD:
            if (this.rowIndex == this.parentItem.getLastChildRowIndex())
                handle = this.skin.STR_HANDLE_TBD_UR;
            else
                handle = this.skin.STR_HANDLE_TBD_URD;
            break;

        case N_ITEM_LEAF:
        case N_ITEM_NOTICE:
        case N_ITEM_DOWNLOADER:
            break;
        }
        this.handle.innerHTML = handle;

        // ���� icon
        if (this.iconstr == null) {
            this.icon.innerHTML = this.skin.getDefIconString(this.st);
        } else {
            this.icon.innerHTML = this.iconstr;
        }

        // ������ɫ��Ϊ������ʾ��
        if (this.hicolor == null) {
            this.style.color = this.skin.getDefColorString(this.st);
        } else {
            this.style.color = this.hicolor;
        }
    }

    // �ѡ��ڵ��С������趨��ָ���ġ�������ʾ��״̬
    function TreeItemData_highlight(hicolor) {
        // this ��һ�����ڵ��С�����
        if (hicolor == "") hicolor = null;
        this.hicolor = hicolor;
        this.redraw();
    }

    // Ϊ���ڵ��С������趨�ر�� icon
    function TreeItemData_setIcon(iconstr) {
        // this ��һ�����ڵ��С�����
        if (iconstr == "") iconstr = null;
        this.iconstr = iconstr;
        this.redraw();
    }

    // ����ÿ�����ڵ��С����� handle �ĵ������
    function TreeItemData_onClickHandle() {
        var oItem = TreeItemData_getAncestorOfTag(event.srcElement, "TR");

        switch (oItem.st) {
        case N_ITEM_COLLAPSED:
            oItem.st = N_ITEM_EXPANDED;
            oItem.showItemRecursive(true);
            break;

        case N_ITEM_EXPANDED:
            oItem.st = N_ITEM_COLLAPSED;
            oItem.showItemRecursive(true);
            break;

        case N_ITEM_TBD:
            // ���� TBD �ͽڵ㣬�������ز���
            oDownloader = (new TreeItemData(oItem.lv + 1, "�������أ����Ժ򡭡�")).renderItem(oItem);
            oItem.insertAdjacentElement("afterEnd", oDownloader);
            oDownloader.setParentTo(oItem);
            oDownloader.st = N_ITEM_DOWNLOADER;
            oDownloader.addBehavior("#default#download");
            oItem.st = N_ITEM_EXPANDED;
            oItem.showItemRecursive(true);

            TreeItemData_startDownload(oDownloader, oItem.dlurl);
            break;
        }
    }

    // �������ز��ɹ��Ľڵ㣬�����������ز���
    function TreeItemData_onReDownload() {
        oDownloader = event.srcElement.parentElement.parentElement;
        oDownloader.st = N_ITEM_DOWNLOADER;
        oDownloader.redraw();

        var oLauncher = oDownloader.parentItem;
        TreeItemData_startDownload(oDownloader, oLauncher.dlurl);
    }

    // ��չ��һ�� TBD �ͽڵ�ʱ��������Ӧ�����ز���
    function TreeItemData_startDownload(oDownloader, dlurl) {
        oDownloader.dr = -1; // download result
        oDownloader.startDownload(dlurl, TreeItemData_onDownloadDone);

        var oParentItem = oDownloader.parentItem;
        if (oDownloader.dr < 1) {
            if (oDownloader.dr == -1) {
                oDownloader.caption.innerText = "����ʧ��";
                oDownloader.st = N_ITEM_NOTICE;
            } else if (oDownloader.dr == -2) {
                oDownloader.caption.innerText = "���ݸ�ʽ����";
                oDownloader.st = N_ITEM_NOTICE;
            } else if (oDownloader.dr == 0) {
                oDownloader.caption.innerText = "�������ݣ�";
                oDownloader.st = N_ITEM_TBD;
            }
            oDownloader.caption.style.cursor = "hand";
            oDownloader.caption.title = "��������";
            oDownloader.caption.onclick = TreeItemData_onReDownload;
            oDownloader.redraw();
        } else {
            // ɾ�� oDownloader �Լ�
            oDownloader.remove();
            oDownloader = null;
        }

        oParentItem.showItemRecursive(true);
    }

    // ���سɹ���Ĵ���
    function TreeItemData_onDownloadDone(s) {
        oDownloader.dr = 1;

        // �ȼ�� TBD ���ڵ��С������϶���� onDownloadDone
        var oLauncher = oDownloader.parentItem;
        if (typeof(oLauncher.onDownloadDone) == "function") {
            oLauncher.onDownloadDone(oDownloader, s);
            return;
        }

        // �ټ�� TABLE �����϶���� onDownloadDone
        var oTABLE = oDownloader.parentElement.parentElement;
        if (typeof(oTABLE.onDownloadDone) == "function") {
            oTABLE.onDownloadDone(oDownloader, s);
        }
    }

    // ��ȡָ��Ԫ����Χ���ض����͵�Ԫ��
    function TreeItemData_getAncestorOfTag(from, tag) {
        while (from != null) {
            if (from.tagName == tag) return from;
            from = from.parentNode;
        }
        return null;
    }
}

// һ���ȽϺ������� childItems.sort() ʹ��
// ��ڲ���Ӧ��Ϊ���� TR ������������������ǵ� rowIndex
function CompareChildOrder(tr1, tr2) {
    return tr1.rowIndex - tr2.rowIndex;
}

function PureSkin() {
    this.N_INDENT = 15;

    this.STR_STYLE_PREFIX = "width:0";
    this.STR_STYLE_HANDLE = "cursor:hand;font-family:Wingdings;font-weight:normal;width:12px;color:seagreen;";
    this.STR_STYLE_ICON = "font-family:Wingdings;font-weight:normal;width:19px;padding-left:2px;";

    this.STR_PREFIX_L = "";
    this.STR_PREFIX_LUD = "";
    this.STR_PREFIX_LUR = "";
    this.STR_PREFIX_LURD = "";

    this.STR_HANDLE_COL_R = "&#240;";
    this.STR_HANDLE_COL_UR = "&#240;";
    this.STR_HANDLE_COL_URD = "&#240;";

    this.STR_HANDLE_EXP_R = "&#242;";
    this.STR_HANDLE_EXP_UR = "&#242;";
    this.STR_HANDLE_EXP_URD = "&#242;";

    this.STR_HANDLE_TBD_R = "&#240;";
    this.STR_HANDLE_TBD_UR = "&#240;";
    this.STR_HANDLE_TBD_URD = "&#240;";

    this.getDefIconString = PureSkin_getDefIconString;
    function PureSkin_getDefIconString(n) {
        switch (n) {
            case N_ITEM_COLLAPSED:  return "&#48;";
            case N_ITEM_EXPANDED:   return "&#49;";
            case N_ITEM_TBD:        return "&#48;";
            case N_ITEM_LEAF:       return "&#119;";
            case N_ITEM_NOTICE:     return "&#178;";
            case N_ITEM_DOWNLOADER: return "&#91;";
        }
        return "&#76;";
    }

    this.getDefColorString = PureSkin_getDefColorString;
    function PureSkin_getDefColorString(n) {
        switch (n) {
            case N_ITEM_COLLAPSED:  return "";
            case N_ITEM_EXPANDED:   return "";
            case N_ITEM_TBD:        return "gray";
            case N_ITEM_LEAF:       return "";
            case N_ITEM_NOTICE:     return "red";
            case N_ITEM_DOWNLOADER: return "blue";
        }
        return "red";
    }
}

function CharSkin() {
    this.N_INDENT = 0;

    this.STR_STYLE_PREFIX = "font-weight:normal;";
    this.STR_STYLE_HANDLE = "cursor:hand;font-weight:normal;";
    this.STR_STYLE_ICON = "font-weight:normal;";

    this.STR_PREFIX_L = "��";
    this.STR_PREFIX_LUD = "��";
    this.STR_PREFIX_LUR = "��";
    this.STR_PREFIX_LURD = "��";

    this.STR_HANDLE_COL_R = "��";
    this.STR_HANDLE_COL_UR = "��";
    this.STR_HANDLE_COL_URD = "��";

    this.STR_HANDLE_EXP_R = "��";
    this.STR_HANDLE_EXP_UR = "��";
    this.STR_HANDLE_EXP_URD = "��";

    this.STR_HANDLE_TBD_R = "��";
    this.STR_HANDLE_TBD_UR = "��";
    this.STR_HANDLE_TBD_URD = "��";

    this.getDefIconString = CharSkin_getDefIconString;
    function CharSkin_getDefIconString(n) {
        switch (n) {
            case N_ITEM_COLLAPSED:  return "��";
            case N_ITEM_EXPANDED:   return "��";
            case N_ITEM_TBD:        return "��";
            case N_ITEM_LEAF:       return "��";
            case N_ITEM_NOTICE:     return "�u";
            case N_ITEM_DOWNLOADER: return "��";
        }
        return "�t";
    }

    this.getDefColorString = CharSkin_getDefColorString;
    function CharSkin_getDefColorString(n) {
        switch (n) {
            case N_ITEM_COLLAPSED:  return "";
            case N_ITEM_EXPANDED:   return "";
            case N_ITEM_TBD:        return "gray";
            case N_ITEM_LEAF:       return "";
            case N_ITEM_NOTICE:     return "red";
            case N_ITEM_DOWNLOADER: return "blue";
        }
        return "red";
    }
}

function ImageSkin() {
    this.N_INDENT = 0;

    this.STR_STYLE_PREFIX = "";
    this.STR_STYLE_HANDLE = "cursor:hand;";
    this.STR_STYLE_ICON = "font-weight:normal;width:19px;padding-left:2px;";

    this.STR_PREFIX_L = "<img align=middle src=tree_l.gif>";
    this.STR_PREFIX_LUD = "<img align=middle src=tree_lud.gif>";
    this.STR_PREFIX_LUR = "<img align=middle src=tree_lur.gif>";
    this.STR_PREFIX_LURD = "<img align=middle src=tree_lurd.gif>";

    this.STR_HANDLE_COL_R = "<img align=middle src=tree_pr.gif>";
    this.STR_HANDLE_COL_UR = "<img align=middle src=tree_pur.gif>";
    this.STR_HANDLE_COL_URD = "<img align=middle src=tree_purd.gif>";

    this.STR_HANDLE_EXP_R = "<img align=middle src=tree_mr.gif>";
    this.STR_HANDLE_EXP_UR = "<img align=middle src=tree_mur.gif>";
    this.STR_HANDLE_EXP_URD = "<img align=middle src=tree_murd.gif>";

    this.STR_HANDLE_TBD_R = "<img align=middle src=tree_pr.gif>";
    this.STR_HANDLE_TBD_UR = "<img align=middle src=tree_pur.gif>";
    this.STR_HANDLE_TBD_URD = "<img align=middle src=tree_purd.gif>";

    this.getDefIconString = ImageSkin_getDefIconString;
    function ImageSkin_getDefIconString(n) {
        switch (n) {
            case N_ITEM_COLLAPSED:  return "<img align=middle src=tree_col.gif>";
            case N_ITEM_EXPANDED:   return "<img align=middle src=tree_exp.gif>";
            case N_ITEM_TBD:        return "<img align=middle src=tree_tbd.gif>";
            case N_ITEM_LEAF:       return "<img align=middle src=tree_leaf.gif>";
            case N_ITEM_NOTICE:     return "<img align=middle src=tree_notice.gif>";
            case N_ITEM_DOWNLOADER: return "<img align=middle src=tree_leaf.gif>";
        }
        return "<img align=middle src=tree_notice.gif>";
    }

    this.getDefColorString = ImageSkin_getDefColorString;
    function ImageSkin_getDefColorString(n) {
        switch (n) {
            case N_ITEM_COLLAPSED:  return "";
            case N_ITEM_EXPANDED:   return "";
            case N_ITEM_TBD:        return "gray";
            case N_ITEM_LEAF:       return "";
            case N_ITEM_NOTICE:     return "red";
            case N_ITEM_DOWNLOADER: return "blue";
        }
        return "red";
    }
}
