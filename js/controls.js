/**
 * Created by ghassaei on 10/31/16.
 */


function initControls(globals){

    window.addEventListener('resize', function(){
        globals.threeView.onWindowResize();
    }, false);

    $("#logo").mouseenter(function(){
        $("#activeLogo").show();
        $("#inactiveLogo").hide();
    });
    $("#logo").mouseleave(function(){
        $("#inactiveLogo").show();
        $("#activeLogo").hide();
    });

    setLink(".seeMore", function(e){
        var $target = $(e.target);
        if (!$target.hasClass("seeMore")) $target = $target.parent();
        var $div = $("#"+ $target.data("id"));
        if ($target.hasClass("closed")){
            $target.removeClass("closed");
            $target.addClass("open");
            AnimateRotate(-90, 0, $target.children("span"));
            $div.removeClass("hide");
            $div.css('display', 'block');
        } else {
            $target.removeClass("open");
            $target.addClass("closed");
            AnimateRotate(0, -90, $target.children("span"));
            $div.hide();
        }
        $(".seeMore").blur();
    });

    function AnimateRotate(from, to, $elem) {
        // we use a pseudo object for the animation
        // (starts from `0` to `angle`), you can name it as you want
        $({deg: from}).animate({deg: to}, {
            duration: 200,
            step: function(now) {
                // in the step-callback (that is fired each step of the animation),
                // you can use the `now` paramter which contains the current
                // animation-position (`0` up to `angle`)
                $elem.css({
                    transform: 'rotate(' + now + 'deg)'
                });
            }
        });
    }

    setLink("#about", function(){
        $('#aboutModal').modal('show');
    });

    setLink("#addForce", function(){
        globals.addRemoveFixedMode = false;
        globals.addForceMode = true;
        globals.deleteMode = false;
    });

    setLink("#addRemoveFixed", function(){
        globals.addForceMode = false;
        globals.addRemoveFixedMode = true;
        globals.deleteMode = false;
    });

    setLink("#deleteMode", function(){
        globals.addForceMode = false;
        globals.addRemoveFixedMode = false;
        globals.deleteMode = true;
    });

    setLink("#solve", function(){
        globals.solver.solve();
    });

    setCheckbox("#lockForces", globals.lockForces, function(val){
        globals.lockForces = val;
    });
    setCheckbox("#lockTopology", globals.lockTopology, function(val){
        globals.lockTopology = val;
    });
    setCheckbox("#lockNodePositions", globals.lockNodePositions, function(val){
        globals.lockNodePositions = val;
    });
    setCheckbox("#xyOnly", globals.xyOnly, function(val){
        globals.xyOnly = val;
        globals.threeView.enableRotate(!val);
        if (val) globals.threeView.squareWithXY();
        globals.solver.solve();
    });
    globals.threeView.enableRotate(!globals.xyOnly);
    if (globals.xyOnly) globals.threeView.squareWithXY();

    var scaleHTML = "";
    for (var i=0;i<=20;i++){
        scaleHTML += "<div>";
        scaleHTML += "<div id='swatch" + i + "' class='colorSwatch'></div>";
        if (i%5 == 0) scaleHTML += "<span id='label" + i + "'></span>";
        scaleHTML += "</div>";
    }
    $("#scaleBars").html(scaleHTML);

    var scaleHTML = "";
    for (var i=0;i<=20;i++){
        scaleHTML += "<div>";
        scaleHTML += "<div id='tension" + i + "' class='colorSwatch'></div>";
        scaleHTML += "<div id='compression" + i + "' class='colorSwatch'></div>";
        if (i%5 == 0) scaleHTML += "<span id='labelCT" + i + "'></span>";
        scaleHTML += "</div>";
    }
    $("#tension-compressionScale").html(scaleHTML);

    function updateScaleBars(min, max){
        for (var i=0;i<=20;i++){
            var val = (max-min)*(20-i)/20+min;
            $("#swatch" + i).css("background", hexForVal(val, min, max));
            if (i%5 == 0) $("#label" + i).html(val.toFixed(2));
        }
    }
    function hexForVal(val, min, max){
        var scaledVal = (1-(val - min)/(max - min)) * 0.7;
        var color = new THREE.Color();
        color.setHSL(scaledVal, 1, 0.5);
        return "#" + color.getHexString();
    }

    function updateRedBlueScaleBars(max){
        for (var i=0;i<=20;i++){
            var val = (max-0)*(20-i)/20+0;
            $("#tension" + i).css("background", hexForRGBVal(val, max, false));
            $("#compression" + i).css("background", hexForRGBVal(val, max, true));
            if (i%5 == 0) $("#labelCT" + i).html(val.toFixed(2));
        }
    }
    function hexForRGBVal(val, max, isCompression){
        var scaledVal = Math.pow(val/max, 1/2);
        var color = new THREE.Color();
        if (isCompression) color.setRGB(scaledVal, 0, 0);
        else color.setRGB(0, 0, scaledVal);
        return "#" + color.getHexString();
    }

    function viewModeCallback(){
        var val = globals.viewMode;
        var data = [];
        if (val == "geometry"){
            _.each(globals.edges, function(edge){
                edge.setDefaultColor();
            });
            globals.threeView.render();
            return;
        } else if (val == "length"){
            for (var i=0;i<globals.edges.length;i++){
                var edge = globals.edges[i];
                data.push(edge.getLength());
            }
        } else if (val == "force"){
            for (var i=0;i<globals.edges.length;i++){
                var force = Math.abs(globals.edges[i].getForce());
                if (globals.edges[i].isFixed()) force = null;
                data.push(force);
            }
        } else if (val == "deformation"){
            for (var i=0;i<globals.edges.length;i++){
                var deformation = Math.abs(globals.edges[i].getDeformation());
                if (deformation == 0) deformation = null;
                data.push(deformation);
            }
        } else if (val == "tensionCompression"){
            for (var i=0;i<globals.edges.length;i++){
                var force = Math.abs(globals.edges[i].getForce());
                data.push(force);
            }
            var max = _.max(data);
            for (var i=0;i<globals.edges.length;i++){
                var edge = globals.edges[i];
                edge.redBlueColor(data[i], max);
            }
            updateRedBlueScaleBars(max);
            globals.threeView.render();
            return;
        }
        var noNulls = _.without(data, null);
        var max = _.max(noNulls);
        var min = _.min(noNulls);
        for (var i=0;i<globals.edges.length;i++){
            var edge = globals.edges[i];
            edge.setHSLColor(data[i], max, min);
        }
        updateScaleBars(min, max);
        globals.threeView.render();
    }
    function viewModeChange(val){
        globals.viewMode = val;
        var $scaleBars = $("#scaleBars");
        var $controls = $("#controls");
        var $redBlue = $("#tension-compressionScale");
        _.each(globals.edges, function(edge){
            edge.updateThickness(true);
        });
        if (val == "geometry"){
            $scaleBars.animate({right: -100});
            $redBlue.animate({right: -100});
            $controls.animate({right:0});
            _.each(globals.edges, function(edge){
                edge.updateThickness();
            });
        } else if (val == "length"){
            $scaleBars.show();
            $redBlue.hide();
            $scaleBars.animate({right: 0});
            $redBlue.animate({right: 0});
            $controls.animate({right:100});
        } else if (val == "force"){
            $scaleBars.show();
            $redBlue.hide();
            $scaleBars.animate({right: 0});
            $redBlue.animate({right: 0});
            $controls.animate({right:100});
        } else if (val == "tensionCompression"){
            $scaleBars.hide();
            $redBlue.show();
            $scaleBars.animate({right: 0});
            $redBlue.animate({right: 0});
            $controls.animate({right:100});
        }
        viewModeCallback();
    }
    setRadio("viewMode", globals.viewMode, viewModeChange);
    viewModeChange(globals.viewMode);

    var $moreInfo = $("#moreInfo");
    var $moreInfoX = $("#moreInfoX");
    var $moreInfoY = $("#moreInfoY");
    var $moreInfoZ = $("#moreInfoZ");
    var $moreInfoInput = $("#moreInfo>input");
    var $moreInfoInputX = $("#moreInfoX>input");
    var $moreInfoInputY = $("#moreInfoY>input");
    var $moreInfoInputZ = $("#moreInfoZ>input");
    var $moreInfoSpan = $("#moreInfo>span");
    function showMoreInfo(string, e){
        $moreInfoSpan.html(string);
        $moreInfo.css({top: e.clientY - 50, left: e.clientX + 10});
        $moreInfoSpan.show();
        $moreInfoInput.hide();
        $moreInfoX.hide();
        $moreInfoY.hide();
        $moreInfoZ.hide();
        $moreInfo.show();
    }
    function hideMoreInfo(){
        $moreInfo.hide();
        $moreInfoInput.hide();
        $moreInfoInput.unbind("change");
        $moreInfoX.hide();
        $moreInfoInputX.unbind("change");
        $moreInfoY.hide();
        $moreInfoInputY.unbind("change");
        $moreInfoZ.hide();
        $moreInfoInputZ.unbind("change");
    }
    function setComponent(comp){
        //if (comp == "x"){
        //    $moreInfoInputX.unbind("change");
        //} else if (comp == "y"){
        //    $moreInfoInputY.unbind("change");
        //} else {
        //    $moreInfoInputZ.unbind("change");
        //}
    }

    function editMoreInfo(val, e, callback){
        var $moreInfo = $("#moreInfo");
        $moreInfo.css({top: e.clientY - 50, left: e.clientX + 10});
        $moreInfoInput.show();
        $moreInfoX.hide();
        $moreInfoY.hide();
        $moreInfoZ.hide();
        $moreInfoSpan.hide();
        $moreInfo.show();
        $moreInfoInput.focus();
        $moreInfoInput.val(val);
        $moreInfoInput.select();
        $moreInfoInput.change(function(){
            var newVal = $moreInfoInput.val();
            if (isNaN(parseFloat(newVal))) return;
            newVal = parseFloat(newVal);
            callback(newVal);
            hideMoreInfo();
        });
    }
    function editMoreInfoXYZ(val, e, callback){
        var $moreInfo = $("#moreInfo");
        $moreInfo.css({top: e.clientY - 50, left: e.clientX + 10});
        $moreInfoX.show();
        $moreInfoY.show();
        $moreInfoZ.show();
        $moreInfoSpan.html("tab to switch x/y/z<br/>");
        $moreInfoSpan.show();
        $moreInfo.show();
        $moreInfoInputX.focus();
        $moreInfoInputX.val(val.x);
        $moreInfoInputY.val(val.y);
        $moreInfoInputZ.val(val.z);
        $moreInfoInputX.select();

        $moreInfoInputX.change(function(){
            setComponent("x");
            var newVal = $moreInfoInputX.val();
            if (isNaN(parseFloat(newVal))) return;
            newVal = parseFloat(newVal);
            callback(newVal, "x");
        });
        $moreInfoInputY.change(function(){
            setComponent("y");
            var newVal = $moreInfoInputY.val();
            if (isNaN(parseFloat(newVal))) return;
            newVal = parseFloat(newVal);
            callback(newVal, "y");
        });
        $moreInfoInputZ.change(function(){
            setComponent("z");
            var newVal = $moreInfoInputZ.val();
            if (isNaN(parseFloat(newVal))) return;
            newVal = parseFloat(newVal);
            callback(newVal, "z");
            hideMoreInfo();
        });
    }
    function editMoreInfoXY(val, e, callback){
        var $moreInfo = $("#moreInfo");
        $moreInfo.css({top: e.clientY - 50, left: e.clientX + 10});
        $moreInfoX.show();
        $moreInfoY.show();
        $moreInfoZ.hide();
        $moreInfoSpan.html("tab to switch x/y<br/>");
        $moreInfoSpan.show();
        $moreInfo.show();
        $moreInfoInputX.focus();
        $moreInfoInputX.val(val.x);
        $moreInfoInputY.val(val.y);
        $moreInfoInputX.select();

        $moreInfoInputX.change(function(){
            setComponent("x");
            var newVal = $moreInfoInputX.val();
            if (isNaN(parseFloat(newVal))) return;
            newVal = parseFloat(newVal);
            callback(newVal, "x");
        });
        $moreInfoInputY.change(function(){
            setComponent("y");
            var newVal = $moreInfoInputY.val();
            if (isNaN(parseFloat(newVal))) return;
            newVal = parseFloat(newVal);
            callback(newVal, "y");
            hideMoreInfo();
        });
    }

    setLink(".about", function(e){
        var $target = $(e.target);
        var id = $target.data("id");
        if (id === undefined) id = $target.parent().data("id");
        $("#" + id).modal("show");
    });

    setInput("#gradStepSize", globals.gradStepSize, function(val){
        globals.gradStepSize = val;
    }, 0.0001);

    setInput("#gradTolerance", globals.gradTolerance, function(val){
        globals.gradTolerance = val;
    }, 0);

    setLink("#optimize", function(){
        $("#pauseOptimization").show();
        $("#optimize").hide();
        $("#resetOptimization").hide();
        globals.gradient.startOptimization();
    });
    setLink("#pauseOptimization", function(){
        $("#pauseOptimization").hide();
        $("#optimize").show();
        $("#resetOptimization").show();
        globals.gradient.pauseOptimization();
    });
    setLink("#resetOptimization", function(){
        globals.gradient.resetOptimization();
    });

    setInput("#symmetryAngle", globals.symmetryAngle, function(val){
        globals.symmetryAngle = val;
        globals.linked.setSymmetryAngle(val);
        globals.threeView.render();
    }, 0, 360);

    setLink("#download", function(){
        var blob = new Blob([globals.getInfo()], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "truss.txt");
    });

    setLink("#clear", function(){
        $("#clearConfirm").modal("show");
    });

    setLink("#doClear", function(){
        globals.clear();
    });

    setLink("#openTxt", function(e){
        $("#fileSelector").click();
        $(e.target).blur();
    });

    var reader = new FileReader();

    function warnUnableToLoad(){
        globals.warn("Unable to load file.");
    }

    $("#fileSelector").change(function(e) {
        var files = e.target.files; // FileList object
        if (files.length < 1) {
            return;
        }

        var file = files[0];
        var extension = file.name.split(".");
        var name = extension[0];
        extension = extension[extension.length - 1];

        $(e.target).val("");

        if (extension == "txt"){
            reader.onload = function () {
                return function (e) {
                    if (!reader.result) {
                        warnUnableToLoad();
                        return;
                    }
                    globals.filename = name;
                    globals.extension = extension;

                    try {
                        var data = JSON.parse(reader.result);
                        var nodes = [];
                        if (data.nodes) nodes = data.nodes;
                        var edges = [];
                        if (data.edges) edges = data.edges;
                        var fixed = [];
                        if (data.fixedNodes) fixed = data.fixedNodes;
                        var forces = [];
                        if (data.externalForces) forces = data.externalForces;
                        var linked = [];
                        if (data.variables) linked = data.variables;

                        if (fixed.length != nodes.length){
                            globals.warn("fixedNodes array is not the same length as nodes array.");
                        }
                        if (forces.length != nodes.length){
                            globals.warn("externalForces array is not the same length as nodes array.");
                        }

                        if (data.symmetryAngle !== undefined) {
                            globals.symmetryAngle = data.symmetryAngle;
                            $("#symmetryAngle").val(globals.symmetryAngle);
                            globals.linked.setSymmetryAngle(globals.symmetryAngle);
                            globals.threeView.render();
                        }

                        globals.setModel(nodes, edges, forces, fixed, linked);

                    } catch(err) {
                        globals.warn("Unable to parse txt file.");
                        console.log(err);
                    }
                }
            }(file);
            reader.readAsText(file);
        } else {
            globals.warn('Unknown file extension: .' + extension);
            return null;
        }

    });

    function setLink(id, callback){
        $(id).click(function(e){
            e.preventDefault();
            callback(e);
        });
    }

    function setRadio(name, val, callback){
        $("input[name=" + name + "]").on('change', function() {
            var state = $("input[name="+name+"]:checked").val();
            callback(state);
        });
        $(".radio>input[value="+val+"]").prop("checked", true);
    }

    function setInput(id, val, callback, min, max){
        var $input = $(id);
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }
            if (min !== undefined && val < min) val = min;
            if (max !== undefined && val > max) val = max;
            $input.val(val);
            callback(val);
        });
        $input.val(val);
    }

    function setCheckbox(id, state, callback){
        var $input  = $(id);
        $input.on('change', function () {
            if ($input.is(":checked")) callback(true);
            else callback(false);
        });
        $input.prop('checked', state);
    }

    function setSlider(id, val, min, max, incr, callback, callbackOnStop){
        var slider = $(id).slider({
            orientation: 'horizontal',
            range: false,
            value: val,
            min: min,
            max: max,
            step: incr
        });
        slider.on("slide", function(e, ui){
            var val = ui.value;
            callback(val);
        });
        slider.on("slidestop", function(){
            var val = slider.slider('value');
            if (callbackOnStop) callbackOnStop(val);
        })
    }

    function setSliderInput(id, val, min, max, incr, callback){

        var slider = $(id+">div").slider({
            orientation: 'horizontal',
            range: false,
            value: val,
            min: min,
            max: max,
            step: incr
        });

        var $input = $(id+">input");
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }

            var min = slider.slider("option", "min");
            if (val < min) val = min;
            if (val > max) val = max;
            $input.val(val);
            slider.slider('value', val);
            callback(val);
        });
        $input.val(val);
        slider.on("slide", function(e, ui){
            var val = ui.value;
            $input.val(val);
            callback(val);
        });
    }


    return {
        showMoreInfo: showMoreInfo,
        editMoreInfoXY: editMoreInfoXY,
        hideMoreInfo: hideMoreInfo,
        editMoreInfo: editMoreInfo,
        viewModeCallback: viewModeCallback,
        setRadio: setRadio
    }
}