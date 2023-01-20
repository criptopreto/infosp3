'use strict'

window.chartColors = {
	red: 'rgb(255, 99, 132)', //red
	orange: 'rgb(255, 159, 64)', //orange
	yellow: 'rgb(242, 179, 69)', //yellow
	green: 'rgb(80, 178, 38)', //green
	blue: 'rgb(109, 113, 268)', //blue
	purple: 'rgb(153, 102, 255)', //purple
	grey: 'rgb(201, 203, 207)' //grey
};

(function(global) {
	var MONTHS = [
		'Enero',
		'Febrero',
		'Marzo',
		'Abril',
		'Mayo',
		'Junio',
		'Julio',
		'Agosto',
		'Septiembre',
		'Octubre',
		'Noviembre',
		'Diciembre'
	];

	var COLORS = [
		'#4dc9f6',
		'#f67019',
		'#f53794',
		'#537bc4',
		'#acc236',
		'#166a8f',
		'#00a950',
		'#58595b',
		'#8549ba'
	];

	var Sigechart = global.Sigechart || (global.Sigechart = {});
	var Color = global.Color;

	Sigechart.utils = {
		// Adapted from http://indiegamr.com/generate-repeatable-random-numbers-in-js/
		srand: function(seed) {
			this._seed = seed;
		},

		rand: function(min, max) {
			var seed = this._seed;
			min = min === undefined ? 0 : min;
			max = max === undefined ? 1 : max;
			this._seed = (seed * 9301 + 49297) % 233280;
			return min + (this._seed / 233280) * (max - min);
		},

		numbers: function(config) {
			var cfg = config || {};
			var min = cfg.min || 0;
			var max = cfg.max || 1;
			var from = cfg.from || [];
			var count = cfg.count || 8;
			var decimals = cfg.decimals || 8;
			var continuity = cfg.continuity || 1;
			var dfactor = Math.pow(10, decimals) || 0;
			var data = [];
			var i, value;

			for (i = 0; i < count; ++i) {
				value = (from[i] || 0) + this.rand(min, max);
				if (this.rand() <= continuity) {
					data.push(Math.round(dfactor * value) / dfactor);
				} else {
					data.push(null);
				}
			}

			return data;
		},

		labels: function(config) {
			var cfg = config || {};
			var min = cfg.min || 0;
			var max = cfg.max || 100;
			var count = cfg.count || 8;
			var step = (max - min) / count;
			var decimals = cfg.decimals || 8;
			var dfactor = Math.pow(10, decimals) || 0;
			var prefix = cfg.prefix || '';
			var values = [];
			var i;

			for (i = min; i < max; i += step) {
				values.push(prefix + Math.round(dfactor * i) / dfactor);
			}

			return values;
		},

		months: function(config) {
			var cfg = config || {};
			var count = cfg.count || 12;
			var section = cfg.section;
			var values = [];
			var i, value;

			for (i = 0; i < count; ++i) {
				value = MONTHS[Math.ceil(i) % 12];
				values.push(value.substring(0, section));
			}

			return values;
		},

		color: function(index) {
			return COLORS[index % COLORS.length];
		},

		transparentize: function(color, opacity) {
			var alpha = opacity === undefined ? 0.5 : 1 - opacity;
			return Color(color).alpha(alpha).rgbString();
        },
        
        tipoChart: ["line", "bar"],

        colores: [
            'rgb(255, 99, 132)', //red
            'rgb(255, 159, 64)', //orange
            'rgb(255, 205, 86)', //yellow
            'rgb(80, 178, 38)', //green
            'rgb(54, 162, 235)', //blue
            'rgb(153, 102, 255)', //purple
            'rgb(201, 203, 207)' //grey
        ]
	};

	// DEPRECATED
	window.randomScalingFactor = function() {
		return Math.round(Sigechart.utils.rand(-100, 100));
	};

	// INITIALIZATION

	Sigechart.utils.srand(Date.now());
}(this));
