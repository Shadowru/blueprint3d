/*
 * Camera Buttons
 */

var CameraButtons = function (blueprint3d) {

    var orbitControls = blueprint3d.three.controls;
    var three = blueprint3d.three;

    var panSpeed = 30;
    var directions = {
        UP: 1,
        DOWN: 2,
        LEFT: 3,
        RIGHT: 4
    };

    function init() {
        // Camera controls
        $("#zoom-in").click(zoomIn);
        $("#zoom-out").click(zoomOut);
        $("#zoom-in").dblclick(preventDefault);
        $("#zoom-out").dblclick(preventDefault);

        $("#reset-view").click(three.centerCamera);

        $("#move-left").click(function () {
            pan(directions.LEFT)
        });

        $("#move-right").click(function () {
            pan(directions.RIGHT)
        });

        $("#move-up").click(function () {
            pan(directions.UP)
        });

        $("#move-down").click(function () {
            pan(directions.DOWN)
        });


        $("#move-left").dblclick(preventDefault);
        $("#move-right").dblclick(preventDefault);
        $("#move-up").dblclick(preventDefault);
        $("#move-down").dblclick(preventDefault);
    }

    function preventDefault(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function pan(direction) {
        switch (direction) {
            case directions.UP:
                orbitControls.panXY(0, panSpeed);
                break;
            case directions.DOWN:
                orbitControls.panXY(0, -panSpeed);
                break;
            case directions.LEFT:
                orbitControls.panXY(panSpeed, 0);
                break;
            case directions.RIGHT:
                orbitControls.panXY(-panSpeed, 0);
                break;
        }
    }

    function zoomIn(e) {
        e.preventDefault();
        orbitControls.dollyIn(1.1);
        orbitControls.update();
    }

    function zoomOut(e) {
        e.preventDefault();
        orbitControls.dollyOut(1.1);
        orbitControls.update();
    }

    init();
};

/*
 * Context menu for selected item
 */

var ContextMenu = function (blueprint3d) {

    var scope = this;
    var selectedItem;
    var three = blueprint3d.three;

    function init() {
        $("#context-menu-delete").click(function (event) {
            selectedItem.remove();
        });

        three.itemSelectedCallbacks.add(itemSelected);
        three.itemUnselectedCallbacks.add(itemUnselected);

        initResize();

        $("#fixed").click(function () {
            var checked = $(this).prop('checked');
            selectedItem.setFixed(checked);
        });
    }

    function cmToIn(cm) {
        return cm / 1;
    }

    function inToCm(inches) {
        return inches * 1;
    }

    function itemSelected(item) {
        selectedItem = item;

        $("#context-menu-name").text(item.metadata.itemName);

        $("#item-width").val(selectedItem.getWidth().toFixed(0));
        $("#item-height").val(selectedItem.getHeight().toFixed(0));
        $("#item-depth").val(selectedItem.getDepth().toFixed(0));

        $("#context-menu").show();

        $("#fixed").prop('checked', item.fixed);
    }

    function resize() {
        selectedItem.resize(
            inToCm($("#item-height").val()),
            inToCm($("#item-width").val()),
            inToCm($("#item-depth").val())
        );
    }

    function initResize() {
        $("#item-height").change(resize);
        $("#item-width").change(resize);
        $("#item-depth").change(resize);
    }

    function itemUnselected() {
        selectedItem = null;
        $("#context-menu").hide();
    }

    init();
};

/*
 * Loading modal for items
 */

var ModalEffects = function (blueprint3d) {

    var scope = this;
    var blueprint3d = blueprint3d;
    var itemsLoading = 0;

    this.setActiveItem = function (active) {
        itemSelected = active;
        update();
    };

    function update() {
        if (itemsLoading > 0) {
            $("#loading-modal").show();
        } else {
            $("#loading-modal").hide();
        }
    }

    function init() {
        blueprint3d.model.scene.itemLoadingCallbacks.add(function () {
            itemsLoading += 1;
            update();
        });

        blueprint3d.model.scene.itemLoadedCallbacks.add(function () {
            itemsLoading -= 1;
            update();
        });

        update();
    }

    init();
};

/*
 * Side menu
 */

var SideMenu = function (blueprint3d, floorplanControls, modalEffects) {
    var blueprint3d = blueprint3d;
    var floorplanControls = floorplanControls;
    var modalEffects = modalEffects;

    var ACTIVE_CLASS = "active";

    var tabs = {
        "FLOORPLAN": $("#floorplan_tab"),
        "SHOP": $("#items_tab"),
        "DESIGN": $("#design_tab")
    };

    var scope = this;
    this.stateChangeCallbacks = $.Callbacks();

    this.states = {
        "DEFAULT": {
            "div": $("#viewer"),
            "tab": tabs.DESIGN
        },
        "FLOORPLAN": {
            "div": $("#floorplanner"),
            "tab": tabs.FLOORPLAN
        },
        "SHOP": {
            "div": $("#add-items"),
            "tab": tabs.SHOP
        }
    };

    // sidebar state
    var currentState = scope.states.FLOORPLAN;

    function init() {
        for (var tab in tabs) {
            var elem = tabs[tab];
            elem.click(tabClicked(elem));
        }

        $("#update-floorplan").click(floorplanUpdate);

        initLeftMenu();

        blueprint3d.three.updateWindowSize();
        handleWindowResize();

        initItems();

        setCurrentState(scope.states.DEFAULT);
    }

    function floorplanUpdate() {
        setCurrentState(scope.states.DEFAULT);
    }

    function tabClicked(tab) {
        return function () {
            // Stop three from spinning
            blueprint3d.three.stopSpin();

            // Selected a new tab
            for (var key in scope.states) {
                var state = scope.states[key];
                if (state.tab == tab) {
                    setCurrentState(state);
                    break;
                }
            }
        }
    }

    function setCurrentState(newState) {

        if (currentState == newState) {
            return;
        }

        // show the right tab as active
        if (currentState.tab !== newState.tab) {
            if (currentState.tab != null) {
                currentState.tab.removeClass(ACTIVE_CLASS);
            }
            if (newState.tab != null) {
                newState.tab.addClass(ACTIVE_CLASS);
            }
        }

        // set item unselected
        blueprint3d.three.getController().setSelectedObject(null);

        // show and hide the right divs
        currentState.div.hide();
        newState.div.show();

        // custom actions
        if (newState == scope.states.FLOORPLAN) {
            floorplanControls.updateFloorplanView();
            floorplanControls.handleWindowResize();
        }

        if (currentState == scope.states.FLOORPLAN) {
            blueprint3d.model.floorplan.update();
        }

        if (newState == scope.states.DEFAULT) {
            blueprint3d.three.updateWindowSize();
        }

        // set new state
        handleWindowResize();
        currentState = newState;

        scope.stateChangeCallbacks.fire(newState);
    }

    function initLeftMenu() {
        $(window).resize(handleWindowResize);
        handleWindowResize();
    }

    function handleWindowResize() {
        $(".sidebar").height(window.innerHeight);
        $("#add-items").height(window.innerHeight);

    }

    // TODO: this doesn't really belong here
    function initItems() {
        $("#add-items").find(".add-item").mousedown(function (e) {
            var modelUrl = $(this).attr("model-url");
            var itemType = parseInt($(this).attr("model-type"));
            var metadata = {
                itemName: $(this).attr("model-name"),
                resizable: true,
                modelUrl: modelUrl,
                itemType: itemType
            };

            blueprint3d.model.scene.addItem(itemType, modelUrl, metadata);
            setCurrentState(scope.states.DEFAULT);
        });
    }

    init();

};

/*
 * Change floor and wall textures
 */

var TextureSelector = function (blueprint3d, sideMenu) {

    var scope = this;
    var three = blueprint3d.three;
    var isAdmin = isAdmin;

    var currentTarget = null;

    function initTextureSelectors() {
        $(".texture-select-thumbnail").click(function (e) {
            var textureUrl = $(this).attr("texture-url");
            var textureStretch = ($(this).attr("texture-stretch") == "true");
            var textureScale = parseInt($(this).attr("texture-scale"));
            currentTarget.setTexture(textureUrl, textureStretch, textureScale);

            e.preventDefault();
        });
    }

    function init() {
        three.wallClicked.add(wallClicked);
        three.floorClicked.add(floorClicked);
        three.itemSelectedCallbacks.add(reset);
        three.nothingClicked.add(reset);
        sideMenu.stateChangeCallbacks.add(reset);
        initTextureSelectors();
    }

    function wallClicked(halfEdge) {
        currentTarget = halfEdge;
        $("#floorTexturesDiv").hide();
        $("#wallTextures").show();
    }

    function floorClicked(room) {
        currentTarget = room;
        $("#wallTextures").hide();
        $("#floorTexturesDiv").show();
    }

    function reset() {
        $("#wallTextures").hide();
        $("#floorTexturesDiv").hide();
    }

    init();
};

/*
 * Floorplanner controls
 */

var ViewerFloorplanner = function (blueprint3d) {

    var canvasWrapper = '#floorplanner';

    // buttons
    var move = '#move';
    var remove = '#delete';
    var draw = '#draw';

    var load_plan = "#load-plan";

    var load_plan_image = "#load-plan-image";

    var plan_zoom_out = "#plan-zoom-out";
    var plan_zoom_in = "#plan-zoom-in";
    var plan_reset_view = "#plan-reset-view";
    var plan_move_left = "#plan-move-left";
    var plan_move_right = "#plan-move-right";
    var plan_move_up = "#plan-move-up";
    var plan_move_down = "#plan-move-down";

    var moveDelta = 5;

    var zoomDelta = 0.05;

    var rotateAngle = 1;

    var ruler = "#ruler";
    var ruler_set_length = "#ruler_set_length";
    var ruler_length = "#ruler_length";

    var rotate_left = "#rotate-left";
    var rotate_right = "#rotate-right";

    var activeStyle = 'btn-primary disabled';

    this.floorplanner = blueprint3d.floorplanner;

    var scope = this;

    function init() {

        $(window).resize(scope.handleWindowResize);
        scope.handleWindowResize();

        // mode buttons
        scope.floorplanner.modeResetCallbacks.add(function (mode) {
            $("#rulerDiv").hide();

            $(draw).removeClass(activeStyle);
            $(remove).removeClass(activeStyle);
            $(move).removeClass(activeStyle);
            $(ruler).removeClass(activeStyle);

            if (mode == BP3D.Floorplanner.floorplannerModes.MOVE) {
                $(move).addClass(activeStyle);
            } else if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
                $(draw).addClass(activeStyle);
            } else if (mode == BP3D.Floorplanner.floorplannerModes.DELETE) {
                $(remove).addClass(activeStyle);
            } else
            if (mode == BP3D.Floorplanner.floorplannerModes.RULER) {
                $("#rulerDiv").show();
                $(ruler).addClass(activeStyle);
            }

            if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
                $("#draw-walls-hint").show();
                scope.handleWindowResize();
            } else {
                $("#draw-walls-hint").hide();
            }
        });

        $(ruler).click(function () {
            $("#rulerDiv").show();
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.RULER);
        });

        $(move).click(function () {
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.MOVE);
        });

        $(draw).click(function () {
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DRAW);
        });

        $(remove).click(function () {
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DELETE);
        });

        $(load_plan_image).change(function (event) {

                var url = URL.createObjectURL(event.target.files[0]);
                var img = new Image();
                img.onload = function () {
                    scope.floorplanner.view.setPlanTexture(img);
                    scope.floorplanner.view.draw();
                };
                img.src = url;
            }
        );

        $(plan_move_left).click(function () {
            scope.floorplanner.view.movePlanTextureLeft(moveDelta);
            scope.floorplanner.view.draw();
        });

        $(plan_move_right).click(function () {
            scope.floorplanner.view.movePlanTextureRight(moveDelta);
            scope.floorplanner.view.draw();
        });
        $(plan_move_up).click(function () {
            scope.floorplanner.view.movePlanTextureUp(moveDelta);
            scope.floorplanner.view.draw();
        });
        $(plan_move_down).click(function () {
            scope.floorplanner.view.movePlanTextureDown(moveDelta);
            scope.floorplanner.view.draw();
        });

        $(plan_zoom_out).click(function () {
            scope.floorplanner.view.zoomPlanTextureOut(zoomDelta);
            scope.floorplanner.view.draw();
        });
        $(plan_zoom_in).click(function () {
            scope.floorplanner.view.zoomPlanTextureIn(zoomDelta);
            scope.floorplanner.view.draw();
        });
        $(plan_reset_view).click(function () {
            scope.floorplanner.view.zoomPlanTextureReset();
            scope.floorplanner.view.draw();
        });

        $(rotate_left).click(function () {
            scope.floorplanner.view.planTextureRotateLeft(rotateAngle);
            scope.floorplanner.view.draw();
        });

        $(rotate_right).click(function () {
            scope.floorplanner.view.planTextureRotateRight(rotateAngle);
            scope.floorplanner.view.draw();
        });

        $(ruler_set_length).click(function () {
            scope.floorplanner.view.setRulerLength($(ruler_length).val());
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.MOVE);
            scope.floorplanner.view.draw();
        });

    }

    this.updateFloorplanView = function () {
        scope.floorplanner.reset();
    };

    this.handleWindowResize = function () {
        $(canvasWrapper).height(window.innerHeight - $(canvasWrapper).offset().top);
        scope.floorplanner.resizeView();
    };

    init();
};

var mainControls = function (blueprint3d) {
    var blueprint3d = blueprint3d;

    function newDesign() {
        blueprint3d.model.loadSerialized('{\n' +
            '  "floorplan": {\n' +
            '    "corners": {\n' +
            '    },\n' +
            '    "walls": [\n' +
            '    ],\n' +
            '    "wallTextures": [],\n' +
            '    "floorTextures": {},\n' +
            '    "newFloorTextures": {}\n' +
            '  },\n' +
            '  "items": []\n' +
            '}');
    }

    function loadDesign() {
        files = $("#loadFile").get(0).files;
        var reader = new FileReader();
        reader.onload = function (event) {
            var data = event.target.result;
            blueprint3d.model.loadSerialized(data);
        };
        reader.readAsText(files[0]);
    }

    function saveDesign() {
        var data = blueprint3d.model.exportSerialized();
        var a = window.document.createElement('a');
        var blob = new Blob([data], {type: 'text'});
        a.href = window.URL.createObjectURL(blob);
        a.download = 'design.blueprint3d';
        document.body.appendChild(a)
        a.click();
        document.body.removeChild(a)
    }

    function init() {
        $("#new").click(newDesign);
        $("#loadFile").change(loadDesign);
        $("#saveFile").click(saveDesign);
    }

    init();
};

/*
 * Initialize!
 */

$(document).ready(function () {

    // main setup
    var opts = {
        floorplannerElement: 'floorplanner-canvas',
        threeElement: '#viewer',
        threeCanvasElement: 'three-canvas',
        textureDir: "models/textures/",
        widget: false
    };

    var blueprint3d = new BP3D.Blueprint3d(opts);

    var modalEffects = new ModalEffects(blueprint3d);
    var viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
    var contextMenu = new ContextMenu(blueprint3d);
    var sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects);
    var textureSelector = new TextureSelector(blueprint3d, sideMenu);
    var cameraButtons = new CameraButtons(blueprint3d);
    mainControls(blueprint3d);

    // This serialization format needs work
    // Load a simple rectangle room
    blueprint3d.model.loadSerialized('{\n' +
        '  "floorplan": {\n' +
        '    "corners": {\n' +
        '    },\n' +
        '    "walls": [\n' +
        '    ],\n' +
        '    "wallTextures": [],\n' +
        '    "floorTextures": {},\n' +
        '    "newFloorTextures": {}\n' +
        '  },\n' +
        '  "items": []\n' +
        '}');
});
