(function ($, document, window, Raphael, undefined) {
    // jQuery Plugin Factory
    function jQueryPluginFactory($, name, methods, getters) {
        getters = getters instanceof Array ? getters : [];
        var getters_obj = {};
        for (var i = 0; i < getters.length; i++) {
            getters_obj[getters[i]] = true;
        }


        // Create the object
        var Plugin = function (element) {
            this.element = element;
        };
        Plugin.prototype = methods;

        // Assign the plugin
        $.fn[name] = function () {
            var args = arguments;
            var returnValue = this;

            this.each(function () {
                var $this = $(this);
                var plugin = $this.data('plugin-' + name);
                // Init the plugin if first time
                if (!plugin) {
                    plugin = new Plugin($this);
                    $this.data('plugin-' + name, plugin);
                    if (plugin._init) {
                        plugin._init.apply(plugin, args);
                    }

                    // call a method
                } else if (typeof args[0] == 'string' && args[0].charAt(0) != '_' && typeof plugin[args[0]] == 'function') {
                    var methodArgs = Array.prototype.slice.call(args, 1);
                    var r = plugin[args[0]].apply(plugin, methodArgs);
                    // set the return value if method is a getter
                    if (args[0] in getters_obj) {
                        returnValue = r;
                    }
                }

            });

            return returnValue; // returning the jQuery object
        };
    };


    // Some constants
    var WIDTH = 930,
        HEIGHT = 630,
        LABELS_WIDTH = 70;

    // Default options
    var defaults = {
        // The styles for the state
        'stateStyles': {
            fill: "#333",
            stroke: "#666",
            "stroke-width": 1,
            "stroke-linejoin": "round",
            scale: [1, 1]
        },

        // The styles for the hover
        'stateHoverStyles': {
            fill: "#33c",
            stroke: "#000",
            scale: [1.1, 1.1]
        },

        // The time for the animation, set to false to remove the animation
        'stateHoverAnimation': 500,

        // State specific styles. 'ST': {}
        'stateSpecificStyles': {},

        // State specific hover styles
        'stateSpecificHoverStyles': {},


        // Events
        'click': null,

        'mouseover': null,

        'mouseout': null,

        'clickState': {},

        'mouseoverState': {},

        'mouseoutState': {},


        // Labels
        'showLabels': true,

        'labelWidth': 20,

        'labelHeight': 15,

        'labelGap': 6,

        'labelRadius': 3,

        'labelBackingStyles': {
            fill: "#333",
            stroke: "#666",
            "stroke-width": 1,
            "stroke-linejoin": "round",
            scale: [1, 1]
        },

        // The styles for the hover
        'labelBackingHoverStyles': {
            fill: "#33c",
            stroke: "#000"
        },

        'stateSpecificLabelBackingStyles': {},

        'stateSpecificLabelBackingHoverStyles': {},

        'labelTextStyles': {
            fill: "#fff",
            'stroke': 'none',
            'font-weight': 300,
            'stroke-width': 0,
            'font-size': '10px'
        },

        // The styles for the hover
        'labelTextHoverStyles': {},

        'stateSpecificLabelTextStyles': {},

        'stateSpecificLabelTextHoverStyles': {}
    };


    // Methods
    var methods = {
        /**
         * The init function
         */
        _init: function (options) {
            // Save the options
            this.options = {};
            $.extend(this.options, defaults, options);

            // Save the width and height;
            var width = this.element.width();
            var height = this.element.height();

            // Calculate the width and height to match the container while keeping the labels at a fixed size
            var xscale = this.element.width() / WIDTH;
            var yscale = this.element.height() / HEIGHT;
            this.scale = Math.min(xscale, yscale);
            this.labelAreaWidth = Math.ceil(LABELS_WIDTH / this.scale); // The actual width with the labels reversed scaled

            var paperWidthWithLabels = WIDTH + Math.max(0, this.labelAreaWidth - LABELS_WIDTH);
            // Create the Raphael instances
            this.paper = Raphael(this.element.get(0), paperWidthWithLabels, HEIGHT);//this.element.width(), this.element.height());

            // Scale to fit
            this.paper.setSize(width, height);
            this.paper.setViewBox(0, 0, paperWidthWithLabels, HEIGHT, false);

            // Keep track of all the states
            this.stateHitAreas = {}; // transparent for the hit area
            this.stateShapes = {}; // for the visual shape
            this.topShape = null;

            // create all the states
            this._initCreateStates();

            // create the labels for the smaller states
            this.labelShapes = {};
            this.labelTexts = {};
            this.labelHitAreas = {};
            if (this.options.showLabels) {
                this._initCreateLabels();
            }

            // Add the
        },

        /**
         * Create the state objects
         */
        _initCreateStates: function () {
            // TODO: Dynamic attrs
            var attr = this.options.stateStyles;
            var R = this.paper; // shorter name for usage here

            // The coords for each state
            var paths = {
				BE-VAN : "m 468.46,15.57 -3,1.43 0.14,5.29 -4.42,-1.93 0.72,-3.33 1.87,1.99 1.65,-2.43 -1.58,-1.06 z m -32.43,-15.32 11.07,5.98 0.88,7.01 -4.16,3.74 1.42,7.59 3.17,-0.25 -2.18,1.77 -11.89,-4.67 -0.31,5.26 18.11,1.68 4.16,-2.55 6.24,7.37 16.24,-15.84 0.64,-7.29 4.28,-5.36 3.25,4.24 6.42,0.4 5.1,12.2 -6.34,11.98 11.71,14.17 0.53,10.19 5.47,1.65 7.26,-3.38 7.84,5.18 -2.86,11.45 2.24,2.02 v 0 l -4.08,4.56 -0.41,8.09 9.03,11.33 0.27,10.21 -5.41,5.41 -5.5,-2.07 -2.39,5.32 -5.17,0.65 v 0 l -1.58,0.28 v 0 l -5.52,0.34 -6.79,9.82 -16.18,3.4 -0.47,5.43 -5.62,7.04 v 0 l -3.02,-3.36 -6.05,2.68 v 0 h -0.91 v 0 l -6.32,4.66 -15.62,3.27 -5.06,-8.57 -5.99,4.41 -5.39,-0.49 -7,8.42 1.93,-4.87 -4.49,-3.18 -15.29,4.41 -1.17,5.4 -3.15,0.65 -6.36,-4.16 -3.93,3.64 -7.76,-4.87 -2.04,5.27 -5.21,-4.35 -11.22,3.11 -1.11,-4.66 -3.19,-1.05 1.42,-5.06 -7.12,4.35 0.64,-3.24 -12.88,-5 -7.96,1.76 v 0 l -1.46,-1.94 -3.89,3.21 -4.28,-2.28 1.5,-5.43 -2.28,-1.02 -2.28,-12.32 7.14,-6.4 7.1,2.23 12.8,-3.52 3.35,-9.06 -0.14,-8.76 -2.45,-1.21 1.42,-4.52 -4.24,-1.3 -2.78,-14.75 6.24,-9.27 -8.11,-5.58 -2,-12.23 -6.28,-3.6 v 0 l -4.08,-6.56 23.09,-0.99 1.5,5.84 7.92,1.02 9.38,-2.77 -9.22,-17.51 2.45,-6.35 -3.6,-1.74 18.44,-9.75 12.66,-1.28 1.81,2.83 -3.35,7.32 1.05,8.09 7.76,-2.89 12.49,3.02 5.66,-1.15 -0.35,-5.63 5.04,-2.3 11.57,-14.8 z",
				BE-WBR : "m 302.94,245.52 10.68,-7.3 4.76,7.27 5.51,-0.62 7.72,6.01 2.9,-3.22 h 8.62 l 1.55,-6.31 4.07,1.07 -2.04,-3.58 2.02,-1.9 3.25,5.33 4.18,0.09 v 0 -3.83 0 l 23.46,-8.18 -0.17,4.01 6.36,4.51 0.13,-3.47 9.53,-2.45 4.05,-5.18 1.67,6.99 5.9,-0.46 4.12,-3.99 -3.5,-5.12 1.01,-8.22 9.77,3.01 3.63,-1.97 0.78,2.09 1.85,-4.02 6.87,-1.41 6.11,2.54 4.16,6.63 4.41,0.28 0.04,3.92 12.28,-1.74 v 0 h 1.48 v 0 l -0.02,5.82 3.63,2.03 11.05,-8.25 7.3,6.07 v 0 l -0.68,5.37 -4.57,2.6 4.64,6.46 -3.05,2.55 0.2,9.21 -3.66,7.01 v 0 l -6.27,-1.47 -4.64,6.12 -5.59,-0.49 0.29,2.11 -22.05,6.39 0.75,3.42 -4.14,-3.45 -5.17,3.88 -1.87,-6.63 -4.01,0.73 -1.69,4.28 -7.82,-3.76 -1.71,4.25 2.68,8.03 -4.76,1.9 -8.5,-2.78 -5,2.35 0.56,6.08 v 0 l -12.76,4.73 -2.14,-4.34 -4.98,0.83 -1.75,2.8 0.6,-9.31 -3.85,1.26 -7.39,-3.24 -10.51,0.82 -5.03,5.65 0.6,-7.36 -6.28,0.06 -5.74,-8.18 -5.1,-0.07 1.19,-6.57 -10.31,-2.35 0.85,-6.98 -4.57,-4.68 -7.51,9.12 -7.17,-0.12 -2.94,-6.27 0.54,-15.1 3.68,-0.98 z",
				BE-BRU : "m 366.49,186.55 0.78,0.58 v 0 l 1.38,5.2 -2.86,3.44 7.26,4.83 2.93,9 -4.74,3.04 0.76,2.18 v 0 l 3.09,0.34 v 0 l 3.69,3.99 -2.76,0.24 v 0 l -2.53,1.08 v 0 l -15.21,7.08 -9.88,-3.31 -5.43,-11.35 -4.53,1.35 -6.59,-3.32 v 0 l -0.49,0.49 v 0 l -0.12,-0.37 v 0 l 1.97,-2.55 v 0 l 0.56,-2.76 5,-0.25 -0.5,-9.43 3.26,-4.83 v 0 l 3.35,-3.1 v 0 l 1.07,-0.62 v 0 l 2.78,-1.97 v 0 l 1.25,-0.27 v 0 l 7.23,1.32 v 0 l 4.15,-4.62 v 0 l 2.52,1.85 v 0 l 1.99,1.35 v 0 z",
				BE-WHT : "m 178.35,226.79 6.65,3.1 8.66,-2.06 0.64,9.47 13.31,0.46 2.86,3.03 v 0 l 1.07,0.34 v 0 l 9.22,-15.76 6.4,-2.98 0.8,4.45 8.66,-4.17 -0.95,3.07 4.16,7.21 6.96,-0.71 5.49,2.64 7.96,-2.94 3.15,5.73 v 0 l -1.15,6.93 4.26,5.82 8.27,0.64 v 0 h 1.3 v 0 l 17.37,-3.86 1.71,2.21 5.04,-6.31 v 0 0.71 0 l 2.76,1.72 v 0 l 2.49,0.34 -3.68,0.98 -0.54,15.09 2.94,6.27 7.18,0.12 7.51,-9.12 4.57,4.68 -0.86,6.97 10.31,2.35 -1.19,6.57 5.1,0.06 5.74,8.19 6.28,-0.06 -0.6,7.36 5.04,-5.65 10.5,-0.82 7.39,3.24 3.85,-1.25 -0.6,9.31 1.75,-2.81 4.98,-0.82 2.14,4.33 12.76,-4.73 v 0 l -3.77,11.72 v 0 1.01 0 l 0.76,3.2 6.03,-3.11 -1.56,1.86 2.63,6.1 -5.45,9.81 8.91,5.12 -2.67,6.61 -3.64,1.22 3.97,3.96 -3.17,1.49 -1.71,6.84 2.67,9.36 -14.57,3.25 -2.9,-3.89 -4.1,0.06 -4.57,7.08 -10.87,-1.82 -0.95,4.59 -5.47,1.37 -2.12,4.98 -5.84,-0.55 -8.07,6.55 11.19,8.71 4.22,-4.76 1.89,1.09 v 0 h 1.91 v 0 l 2.76,2 v 0 l -0.16,1.03 v 0 l -0.39,4.97 v 0 h -0.68 v 0 l 0.45,8.61 -6.59,4.73 7.49,13.77 -2.88,4.39 0.93,17.47 3.66,1.27 0.93,14.4 5.85,12.22 -2.31,4.85 v 0 l -15.93,-3.44 -8.13,-4.85 -22.2,3.95 -0.56,-4.25 -9.67,-2.59 3.91,-6.52 -5.06,-5.58 4.67,-8.67 6.44,-0.36 7.2,-6.01 -6.42,-10.92 0.54,-8.35 -9.08,-0.15 0.23,2.12 -5.12,-2.18 5.17,-8.96 -0.84,-15.09 4.3,-1 9.4,-11.1 -2.47,-5.86 -5.95,-1 -3.03,-4.19 -2.43,4.31 3.38,5.07 -5.76,0.09 -4.03,-13.81 -4.05,-3.16 -3.85,0.91 -10.08,-14.62 -7.31,4.96 -2.61,-1.64 -1.01,2.07 -0.16,-2.19 -12.76,6.53 -10.1,-7.63 -4.67,-0.15 -2.3,2.71 -1.3,-3.22 -11.71,0.94 -2.68,2.4 -0.82,9.12 -4.03,-2.22 1.71,4.22 -1.89,0.49 -6.71,-8.99 -2.98,-10.61 3.23,-10.13 -2.92,-16.26 -10.13,-12.01 -4.92,1.68 -2.84,-3.02 -13.25,4.03 -0.89,-3.48 4.44,-7.6 -8.58,-2.93 -5.33,8.15 -2,-1.19 -11.87,5.86 -2.84,-3.9 -13.6,-6.22 -2.45,-4.36 0.02,-17.26 -7.72,-19.17 5.06,-5.63 -2.41,-3.92 1.52,-3.8 -13.17,-6.83 1.21,-3.31 -4.2,-6.59 v 0 l 8.25,-3.13 8.25,4.39 8.5,-1.07 3.64,10.36 6.87,3.68 9.03,-11.28 5.41,-0.8 v 0 -1.2 0 z m -116.15,18.54 1.36,-1.78 -5.62,-6.9 2.04,-1.69 -1.85,-2.97 5.19,-3.01 1.71,1.69 0.06,-2.21 3.37,2.67 5.15,-1.26 -0.12,-2.33 7.8,-2.79 -4.61,-6.08 12.39,-5.19 2.8,2.33 -1.21,6.17 4.07,0.86 -2.04,2.15 v 0 l -8.21,6.81 -7.26,2.05 1.23,4.05 -7.04,11.7 z",
				BE-WLG : "m 612.91,213.1 1.56,9.02 -3.58,7.43 v 0 l 6.17,3.28 v 0 l 0.95,0.12 v 0 l 2.67,-2.48 2.47,1.84 v 0 l 0.27,0.86 v 0 h 7.45 l 7.02,10.08 7.72,-0.95 4.22,2.21 5.45,-7.79 -3.56,-6.41 v 0 l 4.83,1.38 8.65,-3.61 3.76,2.85 7.72,-0.52 4.2,3.37 -0.39,7.85 1.19,-2.92 13.83,1.84 12.92,21.77 -2.75,2.54 2.9,3.28 -1.32,1.8 4.01,-2.02 13.81,1.99 -4.94,11.43 -3.54,-0.33 -9.57,9.96 0.44,4.67 3.44,1.58 -1.47,3.15 3.77,1.74 3.52,7.81 8.58,-3.02 15.62,5.03 -1.98,8.08 6.1,2.4 0.86,5.61 -6.85,17.14 12.84,13.62 -0.58,3.89 -8.17,2.46 -0.24,3.13 -5.62,-5.68 -4.88,1.15 -5.29,15.67 -12.59,3 -3.54,5.92 -4,0.7 -1.85,4.36 4.67,11.55 -8.7,2.21 -2.53,6.57 4.07,3.54 -2.8,3.73 -5.22,-1.82 2.45,-3.93 -2.29,-5.27 -6.25,-1.49 -0.29,4.55 -3.67,0.9 -5.8,-3.24 -1.28,-5.9 v 0 l 1.84,-6.85 -4.08,0.09 -0.58,-32.98 -5.22,-1.95 -0.78,-2.88 -22.7,-5.2 -2.21,6.11 3.5,3.98 -4.67,10.08 v 0 h 1.03 v 0 l 5.95,0.46 -7.64,5.67 -5.94,-1.06 -0.72,3 -1.61,-3.15 -6.28,-0.94 -8.39,1.94 4.85,-11.99 -4.54,-0.09 -4.22,-8.48 3.5,-8.57 -9.68,0.36 0.87,-3.65 -8.48,-0.82 -7.76,-8.39 -10.97,2 -4.79,-9.89 -8.54,5.36 -9.24,-6.76 -2.74,5.18 v 0 h 3.07 v 0 l 1.5,3.47 -7.06,6.78 v 0 l -8.13,-2.74 -10.54,7.06 -3.15,-3.92 1.12,-4.81 -10.13,-2.98 -2.61,-3.99 2.71,-6.61 -7.36,-12.52 -6.81,3.17 -2.45,-4.36 1.99,-1.59 -5.31,-0.91 -0.94,-3.75 2.45,-2.81 -4.84,2.56 -4.26,-3.17 -0.41,-4.85 -11.09,-0.79 3.39,-2.38 -1.09,-6.08 -3.99,-8.49 -9.39,-9.11 1.01,-7.37 v 0 l 3.66,-7.01 -0.2,-9.21 3.05,-2.55 -4.64,-6.46 4.57,-2.6 0.68,-5.37 v 0 l 5.15,3.16 -0.48,4.84 4.96,5.24 6.05,-0.61 v 0 l 12.62,4.07 2.98,-2.69 -2.49,-3.16 1.3,-2.88 10.82,1.99 1.63,-2.88 3.89,3.56 3.46,-4.02 5.47,3.71 8.66,-9.04 7.39,-0.58 5.99,8.88 5.7,-0.3 2.72,-5.67 3.02,4.5 9.14,-5.57 0.49,-5.16 v 0 l 1.1,0.56 v 0 l 15.04,-5.62 8.46,-9.33 6.25,0.43 0.44,-2.33 v 0 z",
				BE-VLI : "m 630.58,226.33 4.86,3.77 7.08,-2.61 0.97,3.1 6.89,-4.54 1.34,4.26 v 0 l 3.56,6.41 -5.45,7.78 -4.22,-2.21 -7.72,0.95 -7.02,-10.08 h -7.45 v 0 l -0.27,-0.86 v 0 l -2.47,-1.84 -2.67,2.48 v 0 l -0.95,-0.12 v 0 l -6.17,-3.28 v 0 l 11.07,-0.74 5.58,-6.75 z m -48.4,-156.94 4.32,4.06 0.78,13.15 17.6,7.46 1.26,3.93 20.78,0.43 2.28,9.9 9.1,-4.98 5.89,7.36 -8.81,8.19 4.34,6.18 -7.02,2.01 0.84,9.29 -5.08,-0.37 -3.05,8.8 3.52,3.3 -1.93,7.83 -8.81,10.94 1.5,2.28 4.4,-1.48 1.23,2.99 -6.71,12.56 -4.51,-0.34 -4.12,9.01 -6.54,2.92 0.86,13.55 7.55,4.7 v 0 l -0.45,2.33 -6.24,-0.43 -8.46,9.33 -15.04,5.61 v 0 l -1.11,-0.55 v 0 l -0.49,5.15 -9.14,5.58 -3.02,-4.51 -2.72,5.67 -5.7,0.31 -5.99,-8.89 -7.39,0.58 -8.66,9.04 -5.47,-3.71 -3.46,4.01 -3.89,-3.55 -1.63,2.88 -10.84,-1.97 -1.3,2.88 2.49,3.16 -2.98,2.7 -12.63,-4.07 v 0 l 3.75,-8.12 -3.52,-1.81 1.21,-4.81 v 0 l 1.62,-2.09 v 0 l -1.3,-6.87 8.29,-6.94 v 0 l -1.38,-0.06 v 0 l -2.98,-1.63 1.19,-10.32 3.56,-9.38 4.32,0.58 1.81,-8.18 -3.68,-3.05 -6.11,0.15 -0.6,-2.55 v 0 l -3.97,1.51 v 0 l -4.03,2.28 -2.65,-3.82 -2.51,1.45 -4.28,-7.94 6.58,-5.36 0.64,-7.92 8.87,-3.51 -1.75,-7.25 2.14,-1.08 0.41,2.65 5.5,-2.68 -7.84,-7.9 -7.39,0.93 0.64,7.13 -4.9,2.78 -2.74,-3.05 -3.99,1.42 -2.59,-5.98 -5.58,1.42 v 0 l 5.62,-7.04 0.47,-5.43 16.18,-3.4 6.79,-9.82 5.52,-0.34 v 0 l 1.58,-0.28 v 0 l 5.17,-0.65 2.39,-5.32 5.5,2.07 5.41,-5.41 -0.27,-10.21 -9.03,-11.33 0.41,-8.09 4.08,-4.56 v 0 l 19.1,-0.5 1.93,-3.78 13.91,3.72 13.34,-11.82 5.93,1.55 z",
				BE-WLX : "m 554.77,345.61 7.06,-6.78 -1.5,-3.47 v 0 h -3.07 v 0 l 2.74,-5.18 9.24,6.76 8.54,-5.36 4.79,9.89 10.97,-2 7.76,8.39 8.48,0.82 -0.87,3.65 9.68,-0.36 -3.5,8.57 4.22,8.48 4.54,0.09 -4.85,11.99 8.39,-1.94 6.28,0.94 1.61,3.15 0.72,-3 5.94,1.06 7.64,-5.67 -5.95,-0.46 v 0 h -1.03 v 0 l 4.67,-10.08 -3.5,-3.98 2.21,-6.11 22.7,5.2 0.78,2.88 5.22,1.95 0.58,32.98 4.08,-0.09 -1.84,6.85 v 0 l -11.29,3.12 -1.1,12.5 -12.4,5.93 -1.86,10.31 -6.44,5.68 2.95,3.72 -1.9,5.41 -7.92,4.92 3.39,9.59 -5.88,5.31 -6.01,0.76 -2.53,13.41 -5.33,5.18 9.48,6.14 -1.85,3.49 -3.78,-1.53 1.03,4.66 -2.64,1.06 2.2,1.86 -3.45,3.34 2.69,13.59 6.59,-1.29 8.11,14.44 -0.77,7.42 7.45,-0.96 4,5.01 -4,9.74 8.83,3.81 -0.88,7.97 -3.71,0.63 -2.4,8.05 -5.09,3.74 0.76,2.61 3.52,-0.18 0.02,4.09 -5.72,6.22 -4.77,2.31 -11.09,-4.97 -2.6,6.82 -18.72,-3.74 -6.63,6.82 -0.84,6.36 -3.77,-4.6 -6.89,-2.18 -2.93,3.94 -10.92,2.36 -2.47,3.29 -4.35,-6.15 3.3,-2.72 -0.25,-3.62 -4.59,-3.86 2.53,-4.51 -3.29,-0.81 -1.75,-7.66 -15.66,-10.45 -1.98,4.17 -4.83,1.73 -1.5,-5.48 4.91,-7.34 -10.8,-11.54 -1.81,-1.26 -4.63,3.42 -7.29,-3.12 -7.63,0.72 -0.8,-6.71 -6.78,0.69 -6.46,-14.83 -5.84,0.36 -10.91,-6.22 -2.47,-5.35 -5.2,-0.45 v 0 l 3.74,-6.7 0.29,-8.78 13.27,-9.06 -2.75,-2.89 5.67,-5.76 9.27,-3.19 -4.24,-4.22 0.76,-7.05 -8.11,-7.24 -9.94,1.21 0.35,-5.01 -7.35,-9.6 2.99,0.45 1.66,-5.16 2.78,1.96 5.99,-4.65 0.87,-6.83 2.63,-0.15 -1.52,-3.36 2.67,-10.61 2,9.01 24.26,-1.06 13.36,-5.08 v 0 -1.21 0 l -5.21,-4.93 8.17,-4.48 -0.66,-3.3 -7.12,-8.51 1.3,-1.73 -3.38,-0.82 2.41,-2.85 -7.53,-3.27 9.73,-3.27 -1.25,-3.37 5.53,-2.76 2.94,2.09 3.52,-1.79 15.87,-12.74 -1.07,-8.42 -4.63,-0.57 -3.17,3.73 -1.15,-2.76 10.06,-6.47 -2.59,-4.65 3.85,-4.9 z",
				BE-WNA : "m 396,296.13 -0.56,-6.08 5,-2.35 8.5,2.78 4.76,-1.9 -2.68,-8.03 1.71,-4.25 7.82,3.76 1.69,-4.28 4.01,-0.73 1.87,6.63 5.17,-3.88 4.14,3.45 -0.75,-3.42 22.05,-6.39 -0.29,-2.11 5.59,0.49 4.64,-6.12 6.27,1.47 v 0 l -1.01,7.37 9.39,9.11 3.99,8.49 1.09,6.08 -3.39,2.38 11.09,0.79 0.41,4.85 4.26,3.17 4.84,-2.56 -2.45,2.81 0.94,3.75 5.31,0.91 -1.99,1.59 2.45,4.36 6.81,-3.17 7.36,12.52 -2.71,6.61 2.61,3.99 10.13,2.98 -1.12,4.81 3.15,3.92 10.54,-7.06 8.13,2.74 v 0 l 1.36,3.59 -3.85,4.9 2.59,4.65 -10.06,6.47 1.15,2.76 3.17,-3.73 4.63,0.57 1.07,8.42 -15.87,12.74 -3.52,1.79 -2.94,-2.09 -5.53,2.76 1.25,3.37 -9.73,3.27 7.53,3.27 -2.41,2.85 3.38,0.82 -1.3,1.73 7.12,8.51 0.66,3.3 -8.17,4.48 5.21,4.93 v 0 1.21 0 l -13.36,5.08 -24.26,1.06 -2,-9.01 -2.67,10.61 1.52,3.36 -2.63,0.15 -0.87,6.83 -5.99,4.65 -2.78,-1.96 -1.66,5.16 -2.99,-0.45 7.35,9.6 -0.35,5.01 9.94,-1.21 8.11,7.24 -0.76,7.05 4.24,4.22 -9.27,3.19 -5.67,5.76 2.75,2.89 -13.27,9.06 -0.29,8.78 -3.74,6.7 v 0 l -7.74,4.33 -15.09,-1.8 4.53,-7.97 -5.39,-14.17 2.65,-0.09 5.35,-12.79 -7.96,-11.66 -10.97,-2.99 -0.27,-3.2 0.64,-4.13 4.92,-3.56 0.29,-9.48 4.18,-3.74 -4.1,-8.13 3.5,-0.66 2.53,-10.4 4.07,4.11 -0.84,-9.59 5.56,-5.14 -3.79,-4.91 -8.02,-0.39 -1.71,-4.3 -12.41,9.63 -2.45,7.53 -11.03,8.05 -2.64,5.59 3.79,4.65 -3.01,7.64 1.69,9.06 -18.4,2.65 -11.03,5.28 -3.23,5.61 -17.69,2.68 v 0 l 2.32,-4.85 -5.86,-12.22 -0.93,-14.4 -3.66,-1.27 -0.93,-17.47 2.88,-4.38 -7.49,-13.78 6.59,-4.72 -0.44,-8.61 v 0 h 0.68 v 0 l 0.39,-4.97 v 0 l 0.15,-1.03 v 0 l -2.76,-2.01 v 0 h -1.91 v 0 l -1.88,-1.09 -4.22,4.76 -11.19,-8.7 8.07,-6.56 5.84,0.55 2.12,-4.98 5.46,-1.36 0.96,-4.59 10.87,1.82 4.57,-7.08 4.11,-0.06 2.9,3.89 14.57,-3.25 -2.67,-9.36 1.71,-6.84 3.17,-1.5 -3.96,-3.95 3.63,-1.22 2.67,-6.61 -8.91,-5.11 5.45,-9.81 -2.63,-6.1 1.56,-1.86 -6.03,3.11 -0.76,-3.2 v 0 -1.01 0 z",
				BE-VOV : "m 329.57,45.99 6.28,3.6 2.01,12.23 8.11,5.59 -6.25,9.27 2.79,14.75 4.24,1.3 -1.42,4.52 2.45,1.21 0.13,8.75 -3.34,9.06 -12.8,3.53 -7.1,-2.23 -7.14,6.4 2.28,12.32 2.27,1.02 -1.5,5.43 4.28,2.28 3.89,-3.2 1.46,1.94 v 0 l -0.72,5.74 -2.82,1.2 2.12,4.04 -6.73,5.61 v 0 l -2.1,0.06 v 0 l -5.23,-1.91 -3.06,6.5 2.59,8.81 v 0 l 0.99,2.28 v 0 l -4.63,4.4 -8.57,-4.53 0.95,7.24 -4.63,2.86 2.72,3.2 -1.11,4.05 -8.36,11.62 5.39,1.17 -1.31,13.85 -9.06,6.13 -3.31,-2.51 -2.43,3.8 -7.18,-3.16 -3.34,5.34 3.89,8.12 -5.64,0.95 v 0 l -1.72,-0.09 v 0 l -3.54,-0.86 v 0 l -3.15,-5.73 -7.95,2.94 -5.49,-2.63 -6.96,0.7 -4.17,-7.21 0.96,-3.06 -8.66,4.17 -0.8,-4.45 -6.4,2.98 -9.22,15.76 v 0 l -1.07,-0.34 v 0 l -2.86,-3.04 -13.3,-0.46 -0.64,-9.47 -8.66,2.06 -6.65,-3.1 v 0 l 12.06,-11.76 -4.28,-5.68 2.43,-3.44 -11.55,-9.95 5.05,-9.2 -3.67,-3.13 -5.26,3.07 -3.21,-2.15 3.45,-4.09 -1.5,-3.73 5.02,-0.03 -2.45,-3.32 4.16,-0.68 -9.06,-4.28 5.85,-2.77 -3.38,-4.69 4.98,-7.67 -5.08,-10.18 v 0 h 1.17 v 0 l 2.76,-2.56 -2.1,-2.04 -20.25,-13.89 8.34,-5.56 7.08,-13.46 -4.9,-7.98 -4.96,-1.7 4.69,-3.44 -3.42,-7.62 6.02,-2.94 -3.15,-11.63 v 0 l 9.15,9.27 19.2,-0.37 -2.26,-12.77 4.32,0.96 4.8,-3.35 3.85,2.45 1.76,-5.93 20.3,9.34 15.97,3.91 3.52,2.42 -0.87,12.61 13.07,1.02 5.64,-3.69 -0.09,7.03 7.93,-6.1 1.52,2.42 4.41,-1.27 11.02,-8.96 8.98,0.38 20.74,-15.57 z",
				BE-VBR : "m 474.47,144.59 5.58,-1.42 2.59,5.98 3.99,-1.42 2.74,3.05 4.9,-2.78 -0.64,-7.13 7.39,-0.93 7.84,7.9 -5.5,2.68 -0.41,-2.65 -2.14,1.08 1.75,7.25 -8.87,3.51 -0.64,7.92 -6.58,5.36 4.28,7.94 2.51,-1.45 2.65,3.82 4.03,-2.28 v 0 l 3.97,-1.51 v 0 l 0.6,2.55 6.11,-0.15 3.68,3.05 -1.81,8.18 -4.32,-0.58 -3.56,9.38 -1.19,10.32 2.98,1.63 v 0 l 1.38,0.06 v 0 l -8.29,6.94 1.3,6.87 v 0 l -1.62,2.09 v 0 l -1.21,4.81 3.52,1.81 -3.75,8.12 v 0 l -6.05,0.61 -4.96,-5.24 0.49,-4.84 -5.16,-3.16 v 0 l -7.29,-6.07 -11.05,8.25 -3.64,-2.02 0.02,-5.83 v 0 h -1.48 v 0 l -12.27,1.75 -0.04,-3.93 -4.42,-0.28 -4.16,-6.63 -6.11,-2.55 -6.87,1.41 -1.85,4.02 -0.78,-2.09 -3.64,1.96 -9.76,-3.01 -1.01,8.22 3.5,5.12 -4.12,3.99 -5.89,0.46 -1.67,-6.99 -4.05,5.18 -9.53,2.45 -0.14,3.46 -6.36,-4.51 0.18,-4.02 -23.46,8.19 v 0 3.83 0 l -4.18,-0.09 -3.25,-5.33 -2.02,1.9 2.04,3.59 -4.07,-1.07 -1.56,6.31 h -8.62 l -2.9,3.22 -7.72,-6 -5.51,0.61 -4.77,-7.26 -10.68,7.29 v 0 l -2.76,-1.72 v 0 -0.71 0 l -5.04,6.31 -1.71,-2.21 -17.37,3.86 v 0 h -1.3 v 0 l -8.27,-0.64 -4.26,-5.82 1.15,-6.93 v 0 l 3.54,0.86 v 0 l 1.71,0.09 v 0 l 5.64,-0.95 -3.89,-8.12 3.35,-5.34 7.18,3.16 2.43,-3.8 3.31,2.52 9.06,-6.14 1.3,-13.85 -5.39,-1.17 8.36,-11.62 1.11,-4.06 -2.72,-3.2 4.63,-2.86 -0.95,-7.23 8.58,4.52 4.63,-4.4 v 0 l -0.99,-2.28 v 0 l -2.59,-8.81 3.05,-6.5 5.23,1.91 v 0 l 2.1,-0.06 v 0 l 6.73,-5.61 -2.12,-4.04 2.82,-1.2 0.72,-5.74 v 0 l 7.96,-1.76 12.88,5 -0.64,3.24 7.12,-4.35 -1.42,5.06 3.19,1.05 1.11,4.66 11.22,-3.11 5.21,4.35 2.04,-5.27 7.76,4.87 3.93,-3.64 6.36,4.16 3.15,-0.65 1.17,-5.4 15.29,-4.41 4.49,3.18 -1.93,4.87 7,-8.42 5.39,0.49 5.99,-4.41 5.06,8.57 15.62,-3.27 6.32,-4.66 v 0 h 0.91 v 0 l 6.05,-2.68 z m -124.49,40.67 v 0 l -1.25,0.28 v 0 l -2.78,1.97 v 0 l -1.07,0.62 v 0 l -3.35,3.11 v 0 l -3.27,4.83 0.51,9.43 -5,0.25 -0.56,2.76 v 0 l -1.96,2.55 v 0 l 0.12,0.37 v 0 l 0.49,-0.49 v 0 l 6.59,3.32 4.53,-1.35 5.43,11.36 9.88,3.31 15.21,-7.09 v 0 l 2.53,-1.07 v 0 l 2.76,-0.25 -3.7,-3.99 v 0 l -3.09,-0.34 v 0 l -0.76,-2.18 4.75,-3.04 -2.94,-9 -7.26,-4.83 2.86,-3.44 -1.38,-5.2 v 0 l -1.4,-1.97 v 0 l -1.98,-1.35 v 0 l -2.53,-1.85 v 0 l -4.14,4.61 z",
				BE-VWV : "m 160.68,41.33 3.1,10.59 -4.9,5.93 3.32,4.04 -1.73,1.21 2.72,7.19 v 0 l 3.15,11.63 -6.02,2.94 3.42,7.62 -4.69,3.44 4.96,1.7 4.9,7.98 -7.08,13.46 -8.34,5.56 20.25,13.89 2.1,2.04 -2.76,2.56 v 0 h -1.17 v 0 l 5.08,10.18 -4.98,7.67 3.38,4.69 -5.85,2.77 9.06,4.28 -4.16,0.68 2.45,3.32 -5.02,0.03 1.5,3.73 -3.45,4.09 3.21,2.15 5.26,-3.07 3.67,3.13 -5.05,9.2 11.55,9.95 -2.43,3.44 4.28,5.68 -12.06,11.76 v 0 l -5,4.48 v 0 1.19 0 l -5.41,0.8 -9.03,11.28 -6.86,-3.68 -3.64,-10.36 -8.5,1.07 -8.25,-4.38 -8.25,3.12 v 0 l -5.29,-10.39 -4.78,1.1 -2.71,-2.3 -5.52,6.66 -4.55,-2.43 -5.08,3.38 -2.78,-1.32 v 0 l 2.04,-2.15 -4.06,-0.86 1.2,-6.17 -2.8,-2.33 -12.39,5.19 4.61,6.07 -7.8,2.79 0.12,2.34 -5.16,1.25 -3.36,-2.67 -0.06,2.21 -1.71,-1.68 -5.2,3 1.85,2.98 -2.04,1.68 5.62,6.9 -1.36,1.77 v 0 l -3.06,-4.75 -5.64,2.15 -5.48,-3.34 -1.79,-7.51 -10.88,-12.79 -0.23,-5.41 -8.77,-1.01 -1.79,-2.58 -6.48,2.95 -3.77,-10.97 -3.18,-0.46 2.46,-4.76 -0.65,-10.15 -0.44,-4.7 -3.17,-1.94 8.09,-8.53 -4.81,-13.22 -6.49,-3.79 -5.84,-26.72 42.87,-23.99 60.46,-42.02 20.93,-9.03 -2.74,-6.55 3.25,-3.61 -2.32,2.55 3.04,3.79 2.76,-1.77 -3.4,4.29 1.96,-1.62 0.31,3.39 1.34,-3.82 1.91,1.27 -1.3,-2.11 3.26,0.84 -1.4,-4.72 -1.49,0.96 2.33,-2.18 -4.59,-1.12 4.82,1.19 0.98,6.02 z"
            }

            // Create the actual objects
            var stateAttr = {};
            for (var state in paths) {
                stateAttr = {};
                if (this.options.stateSpecificStyles[state]) {
                    $.extend(stateAttr, attr, this.options.stateSpecificStyles[state]);
                } else {
                    stateAttr = attr;
                }
                this.stateShapes[state] = R.path(paths[state]).attr(stateAttr);
                this.topShape = this.stateShapes[state];

                this.stateHitAreas[state] = R.path(paths[state]).attr({
                    fill: "#000",
                    "stroke-width": 0, "opacity": 0.0, 'cursor': 'pointer'
                });
                this.stateHitAreas[state].node.dataState = state;
            }

            // Bind events
            this._onClickProxy = $.proxy(this, '_onClick');
            this._onMouseOverProxy = $.proxy(this, '_onMouseOver'),
                this._onMouseOutProxy = $.proxy(this, '_onMouseOut');

            for (var state in this.stateHitAreas) {
                this.stateHitAreas[state].toFront();
                $(this.stateHitAreas[state].node).bind('mouseout', this._onMouseOutProxy);
                $(this.stateHitAreas[state].node).bind('click', this._onClickProxy);
                $(this.stateHitAreas[state].node).bind('mouseover', this._onMouseOverProxy);

            }
        },


        /**
         * Create the labels
         */
        _initCreateLabels: function () {
            var R = this.paper; // shorter name for usage here
            var neStates = ['VT', 'NH', 'MA', 'RI', 'CT', 'NJ', 'DE', 'MD', 'DC'];

            // calculate the values for placing items
            var neBoxX = 860;
            var neBoxY = 220;
            var oWidth = this.options.labelWidth;
            var oHeight = this.options.labelHeight;
            var oGap = this.options.labelGap;
            var oRadius = this.options.labelRadius;

            var shapeWidth = oWidth / this.scale;
            var shapeHeight = oHeight / this.scale;

            var colWidth = (oWidth + oGap) / this.scale;
            var downBy = (oHeight + oGap) / this.scale * 0.5;

            var shapeRadius = oRadius / this.scale;

            // Styling information
            var backingAttr = this.options.labelBackingStyles;
            var textAttr = this.options.labelTextStyles;
            var stateAttr = {};

            // NE States
            for (var i = 0, x, y, state; i < neStates.length; ++i) {
                state = neStates[i];

                // position
                x = ((i + 1) % 2) * colWidth + neBoxX;
                y = i * downBy + neBoxY;

                // attributes for styling the backing
                stateAttr = {};
                if (this.options.stateSpecificLabelBackingStyles[state]) {
                    $.extend(stateAttr, backingAttr, this.options.stateSpecificLabelBackingStyles[state]);
                } else {
                    stateAttr = backingAttr;
                }

                // add the backing
                this.labelShapes[state] = R.rect(x, y, shapeWidth, shapeHeight, shapeRadius).attr(stateAttr);

                // attributes for styling the text
                stateAttr = {};
                if (this.options.stateSpecificLabelTextStyles[state]) {
                    $.extend(stateAttr, textAttr, this.options.stateSpecificLabelTextStyles[state]);
                } else {
                    $.extend(stateAttr, textAttr);
                }

                // adjust font-size
                if (stateAttr['font-size']) {
                    stateAttr['font-size'] = (parseInt(stateAttr['font-size']) / this.scale) + 'px';
                }

                // add the text
                this.labelTexts[state] = R.text(x + (shapeWidth / 2), y + (shapeHeight / 2), state).attr(stateAttr);

                // Create the hit areas
                this.labelHitAreas[state] = R.rect(x, y, shapeWidth, shapeHeight, shapeRadius).attr({
                    fill: "#000",
                    "stroke-width": 0,
                    "opacity": 0.0,
                    'cursor': 'pointer'
                });
                this.labelHitAreas[state].node.dataState = state;
            }

            var otherStates = {
				BE-VAN: {x: 420, y: 532},
				BE-WBR: {x: 391, y: 352},
				BE-BRU: {x: 278, y: 403},
				BE-WHT: {x: 278, y: 394},
				BE-WLG: {x: 608, y: 321},
				BE-VLI: {x: 564, y: 453},
				BE-WLX: {x: 577, y: 137},
				BE-WNA: {x: 449, y: 243},
				BE-VOV: {x: 249, y: 463},
				BE-VBR: {x: 413, y: 420},
				BE-VWV: {x: 97, y: 468},
            };
            var textAttr = this.options.labelTextStyles;
            for (var state in otherStates) {
                // attributes for styling the text
                stateAttr = {};
                if (this.options.stateSpecificLabelTextStyles[state]) {
                    $.extend(stateAttr, textAttr, this.options.stateSpecificLabelTextStyles[state]);
                } else {
                    $.extend(stateAttr, textAttr);
                }
                // adjust font-size
                if (stateAttr['font-size']) {
                    stateAttr['font-size'] = (parseInt(stateAttr['font-size']) / this.scale) + 'px';
                }

                this.labelTexts[state] = R.text(otherStates[state].x, otherStates[state].y, state).attr(stateAttr);
                this.labelHitAreas[state] = R.rect(otherStates[state].x - this.options.labelWidth / this.scale / 2, otherStates[state].y - this.options.labelHeight / this.scale / 2, this.options.labelWidth / this.scale, this.options.labelHeight / this.scale, this.options.labelRadius / this.scale).attr({
                    fill: "#000",
                    "stroke-width": 0,
                    "opacity": 0.0,
                    'cursor': 'pointer'
                });
                this.labelHitAreas[state].node.dataState = state;
            }

            // Bind events
            for (var state in this.labelHitAreas) {
                this.labelHitAreas[state].toFront();
                $(this.labelHitAreas[state].node).bind('mouseout', this._onMouseOutProxy);
                $(this.labelHitAreas[state].node).bind('click', this._onClickProxy);
                $(this.labelHitAreas[state].node).bind('mouseover', this._onMouseOverProxy);
            }
        },


        /**
         * Get the state Raphael object
         */
        _getStateFromEvent: function (event) {
            // first get the state name
            var stateName = (event.target && event.target.dataState) || (event.dataState);
            return this._getState(stateName);
        },


        /**
         *
         */
        _getState: function (stateName) {
            var stateShape = this.stateShapes[stateName];
            var stateHitArea = this.stateHitAreas[stateName];
            var labelBacking = this.labelShapes[stateName];
            var labelText = this.labelTexts[stateName];
            var labelHitArea = this.labelHitAreas[stateName]

            return {
                shape: stateShape,
                hitArea: stateHitArea,
                name: stateName,
                labelBacking: labelBacking,
                labelText: labelText,
                labelHitArea: labelHitArea
            };
        },


        /**
         * The mouseout handler
         */
        _onMouseOut: function (event) {
            var stateData = this._getStateFromEvent(event);

            // Stop if no state was found
            if (!stateData.hitArea) {
                return;
            }

            return !this._triggerEvent('mouseout', event, stateData);

        },


        /**
         *
         */
        _defaultMouseOutAction: function (stateData) {
            // hover effect
            // ... state shape
            var attrs = {};
            if (this.options.stateSpecificStyles[stateData.name]) {
                $.extend(attrs, this.options.stateStyles, this.options.stateSpecificStyles[stateData.name]);
            } else {
                attrs = this.options.stateStyles;
            }

            stateData.shape.animate(attrs, this.options.stateHoverAnimation);


            // ... for the label backing
            if (stateData.labelBacking) {
                var attrs = {};

                if (this.options.stateSpecificLabelBackingStyles[stateData.name]) {
                    $.extend(attrs, this.options.labelBackingStyles, this.options.stateSpecificLabelBackingStyles[stateData.name]);
                } else {
                    attrs = this.options.labelBackingStyles;
                }

                stateData.labelBacking.animate(attrs, this.options.stateHoverAnimation);
            }
        },


        /**
         * The click handler
         */
        _onClick: function (event) {
            var stateData = this._getStateFromEvent(event);

            // Stop if no state was found
            if (!stateData.hitArea) {
                return;
            }

            return !this._triggerEvent('click', event, stateData);
        },


        /**
         * The mouseover handler
         */
        _onMouseOver: function (event) {
            var stateData = this._getStateFromEvent(event);

            // Stop if no state was found
            if (!stateData.hitArea) {
                return;
            }

            return !this._triggerEvent('mouseover', event, stateData);
        },


        /**
         * The default on hover action for a state
         */
        _defaultMouseOverAction: function (stateData) {
            // hover effect
            this.bringShapeToFront(stateData.shape);
            // this.paper.safari();

            // ... for the state
            var attrs = {};
            if (this.options.stateSpecificHoverStyles[stateData.name]) {
                $.extend(attrs, this.options.stateHoverStyles, this.options.stateSpecificHoverStyles[stateData.name]);
            } else {
                attrs = this.options.stateHoverStyles;
            }

            stateData.shape.animate(attrs, this.options.stateHoverAnimation);

            // ... for the label backing
            if (stateData.labelBacking) {
                var attrs = {};

                if (this.options.stateSpecificLabelBackingHoverStyles[stateData.name]) {
                    $.extend(attrs, this.options.labelBackingHoverStyles, this.options.stateSpecificLabelBackingHoverStyles[stateData.name]);
                } else {
                    attrs = this.options.labelBackingHoverStyles;
                }

                stateData.labelBacking.animate(attrs, this.options.stateHoverAnimation);
            }
        },


        /**
         * Trigger events
         *
         * @param type string - the type of event
         * @param event Event object - the original event object
         * @param stateData object - information about the state
         *
         * return boolean - true to continue to default action, false to prevent the default action
         */
        _triggerEvent: function (type, event, stateData) {
            var name = stateData.name;
            var defaultPrevented = false;

            // State specific
            var sEvent = $.Event('usmap' + type + name);
            sEvent.originalEvent = event;

            // Do the one in options first
            if (this.options[type + 'State'][name]) {
                defaultPrevented = this.options[type + 'State'][name](sEvent, stateData) === false;
            }

            // Then do the bounded ones
            if (sEvent.isPropagationStopped()) {
                this.element.trigger(sEvent, [stateData]);
                defaultPrevented = defaultPrevented || sEvent.isDefaultPrevented();
            }


            // General
            if (!sEvent.isPropagationStopped()) {
                var gEvent = $.Event('usmap' + type);
                gEvent.originalEvent = event;

                // Options handler first
                if (this.options[type]) {
                    defaultPrevented = this.options[type](gEvent, stateData) === false || defaultPrevented;
                }

                // Bounded options next
                if (!gEvent.isPropagationStopped()) {
                    this.element.trigger(gEvent, [stateData]);
                    defaultPrevented = defaultPrevented || gEvent.isDefaultPrevented();
                }
            }

            // Do the default action
            if (!defaultPrevented) {
                switch (type) {
                    case 'mouseover':
                        this._defaultMouseOverAction(stateData);
                        break;

                    case 'mouseout':
                        this._defaultMouseOutAction(stateData);
                        break;
                }
            }

            return !defaultPrevented;
        },


        /**
         *
         @param string state - The two letter state abbr
         */
        trigger: function (state, type, event) {
            type = type.replace('usmap', ''); // remove the usmap if they added it
            state = state.toUpperCase(); // ensure state is uppercase to match

            var stateData = this._getState(state);

            this._triggerEvent(type, event, stateData);
        },


        /**
         * Bring a state shape to the top of the state shapes, but not above the hit areas
         */
        bringShapeToFront: function (shape) {
            if (this.topShape) {
                shape.insertAfter(this.topShape);
            }
            this.topShape = shape;
        }
    };


    // Getters
    var getters = [];


    // Create the plugin
    jQueryPluginFactory($, 'usmap', methods, getters);

})(jQuery, document, window, Raphael);