/**
 *
 * Copyright (c) 2010 Matteo Spinelli, http://cubiq.org/
 * Released under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 *
 * Version 0.1 - Last updated: 2010.11.21
 *
 */

(function () {
var $ = function (query) {
		return new NL(query);
	},

	NL = function (query) {
		if (query.nodeType) {
			query = [query];
		} else if (typeof query == 'string') {
			query = document.querySelectorAll(query);
		} else if (!(query instanceof Array)) {	// if none of the above, query must be an array
			return null;
		}

		this.length = query.length;
		for (var i=0; i<this.length; i++) {
			this[i] = query[i];
		}

		return this;
	},

	customEvents = {
		tap: { type: 'tap', options: {} },
		doubletap: { type: 'tap', options: { neededTaps: 2 } },
		taphold: { type: 'tap', options: { retain: 800 } },
		swipe: { type: 'swipe', options: {} },
		swipeleft: { type: 'swipe', options: { direction: ['W'] } },
		swiperight: { type: 'swipe', options: { direction: ['E'] } },
		pan: { type: 'swipe', options: { fingers: 2 } },
		panup: { type: 'swipe', options: { fingers: 2, direction: ['N'] } },
		pandown: { type: 'swipe', options: { fingers: 2, direction: ['S'] } },
		gestures: { type: 'gesture', options: { scale: true, rotate: true } },
		pinch: { type: 'gesture', options: { scale: true, maxScale: 1, scaleThreshold: 0.2 } },
		zoom: { type: 'gesture', options: { scale: true, minScale: 1, scaleThreshold: 0.2 } },
		scale: { type: 'gesture', options: { scale: true, scaleThreshold: 0.2 } },
		rotate: { type: 'gesture', options: { rotate: true, rotateThreshold: 10 } }
	},
	eventFn = {},
	eventList = [];

// Merge two objects
$.extend = function (obj, target) {
	for (var prop in obj) {
		target[prop] = obj[prop];
	}
};

$.extend({
	isTouch: 'ontouchstart' in window,

	hasClass: function (el, className) {
		return new RegExp('(^|\\s)' + className + '(\\s|$)').test(el.className);
	},

	abs: function (value) {
		return value < 0 ? -value : value;
	}
}, $);

$.extend({
	startEv: $.isTouch ? 'touchstart' : 'mousedown',
	moveEv: $.isTouch ? 'touchmove' : 'mousemove',
	endEv: $.isTouch ? 'touchend' : 'mouseup',
	cancelEv: $.isTouch ? 'touchcancel' : 'mouseup'
}, $);

NL.prototype = {
	each: function (callback) {
		for (var i=0; i<this.length; i++) {
			callback.call(this[i]);
		}

		return this;
	},

	on: function (type, fn, options) {
		var that = this,
			defaults;

		type = type.toLowerCase();

		if (!customEvents[type]) {
			return that;
		}

		defaults = customEvents[type].options;

		$.extend(options, defaults);

		return that.each(function () {
			eventFn[customEvents[type].type](this, type, fn, defaults);
		});
	},

	off: function (type, fn) {
		if (!type) {
			return;
		}

		var that = this;

		type = type.toLowerCase();

		if (!customEvents[type]) {
			return that;
		}

		var results = [];
		for (var i=(eventList.length - 1); i >= 0; i--) {
			if (this[0] == eventList[i].el[0]) {
				var events = eventList[i];
				if (events.type === events.type) {
					if (!fn || events.fn === fn) {
						results.push(events);
						eventList.splice(i, 1);
					}
				}
			}
		}
		for (var i=0, len=results.length; i<len; i++) {
			var touchlayer = results[i];
			if (touchlayer.options && touchlayer.options.onEnd) {
				touchlayer.options.onEnd.call(touchlayer);
			}
		}
	},

	getEvents: function () {
		var that = this,
		 	i, l = eventList.length,
			result = [];

		for (i=0; i<l; i++) {
			if (this[0] == eventList[i].el[0]) {
				result.push(eventList[i]);
			}
		}

		return result;
	},

	bind: function (type, fn, capture) {
		return this.each(function () {
			this.addEventListener(type, fn, !!capture);
		});
	},

	unbind: function (type, fn, capture) {
		return this.each(function () {
			this.removeEventListener(type, fn, !!capture);
		});
	},

	// Returns the first element className
	hasClass: function (className) {
		return $.hasClass(this[0], className);
	},

	// Add one or more classes to all elements
	addClass: function () {
		var className = arguments;

		for (var i=0, l=className.length; i<l; i++) {
			this.each(function () {
				if (!$.hasClass(this, className[i])) {
					this.className = this.className ? this.className + ' ' + className[i] : className[i];
				}
			});
		}

		return this;
	},

	// Remove one or more classes from all elements
	removeClass: function () {
		var className = arguments;

		for (var i=0, l=className.length; i<l; i++) {
			this.each(function () {
				this.className = this.className.replace(new RegExp('(^|\\s+)' + className[i] + '(\\s+|$)'), ' ');
			});
		}

		return this;
	},

	// Set CSS style
	style: function (attrib, value) {
		if (typeof attrib == 'string' && value === undefined) {
			return window.getComputedStyle(this[0], null).getPropertyValue(attrib);
		}

		if (typeof attrib != 'object') {
			attrib[attrib] = value;
		}

		return this.each(function () {
			for (var i in attrib) {
				this.style[i] = attrib[i];
			}
		});
	},

	attr: function (name, value) {
		var that = this;

		if (value === undefined) {
			return that[0].getAttribute(name);
		}

		return that.each(function () {
			this.setAttribute(name, value);
		});
	}
};

eventFn.tap = function (el, type, fn, options) {
	options = options || {};

	function isRightClick(e) {
		var rightclick = false;

		if (!$.isTouch) {
			// http://www.quirksmode.org/js/events_properties.html
			if (!e) var e = window.event;
			if (e.which) rightclick = (e.which == 3);
			else if (e.button) rightclick = (e.button == 2);
		}
		return rightclick;
	}

	eventList.push(new TouchLayer(el, type, fn, {
		onInit: function () {
			var me = this;

			me.ns = {
				tapCount: 0,
				anybutton: false,
				neededTaps: options.neededTaps || 1,
				interval: options.interval || 400,
				expire: options.expire || 0,
				retain: options.retain || 0
			};

			me.neededTouches = options.fingers || 1;
		},

		onStart: function (e) {
			var me = this;

			if (!me.ns.anybutton && isRightClick(e)) {
				me.expired = true;
			}

			e.preventDefault();

			me.el.addClass('active');

			if (me.ns.retain) {
				clearTimeout(me.ns.retainTimeout);
				me.ns.retainTimeout = null;

				me.ns.retainTimeout = setTimeout(function () {
					me.callback(me);
				}, me.ns.retain);
			}

			if (me.ns.expire) {
				clearTimeout(me.ns.expireTimeout);

				me.ns.expireTimeout = null;

				me.ns.expireTimeout = setTimeout(function () {
					me.expired = true;
				}, me.ns.expire);
			}
		},

		onMove: function () {
			var me = this;

			// If we moved don't perform the tap
			if (me.moved || me.expired) {
				if (me.ns.retainTimeout) {
					clearTimeout(me.ns.retainTimeout);
					me.ns.retainTimeout = null;
				}

				if (me.ns.expireTimeout) {
					clearTimeout(me.ns.expireTimeout);
					me.ns.expireTimeout = null;
				}

				me.el.removeClass('active');
			}
		},

		onEnd: function () {
			var me = this;

			me.el.removeClass('active');

			me.ns.tapCount++;

			if (me.ns.retainTimeout) {
				clearTimeout(me.ns.retainTimeout);
				me.ns.retainTimeout = null;
				return;
			}

			if (me.ns.expireTimeout) {
				clearTimeout(me.ns.expireTimeout);
				me.ns.expireTimeout = null;
			}

			if (me.ns.intervalTimeout) {
				clearTimeout(me.ns.intervalTimeout);
			}

			if (me.ns.tapCount < me.ns.neededTaps) {
				me.ns.intervalTimeout = setTimeout(function () {
					me.ns.tapCount = 0;
				}, me.ns.interval);

				return;
			}

			me.ns.tapCount = 0;

			if (!me.moved && !me.expired) {
				me.callback.call(me);
			}
		}
	}));
};

eventFn.swipe = function (el, type, fn, options) {
	options = options || {};

	eventList.push(new TouchLayer(el, type, fn, {
		onInit: function () {
			var me = this;

			me.ns = {
				distance: options.distance || 60,
				direction: options.direction || ['E', 'W'],
				activateOn: options.activateOn || 'end'
			};

			me.neededTouches = options.fingers || 1;
		},

		onStart: function (e) {
			e.preventDefault();
			this.ns.activated = false;
		},

		onMove: function () {
			var me = this;

			if (!me.ns.activated && me.ns.activateOn == 'move' && me.ns.direction.indexOf(me.startDir) != -1 && (
					(me.absDistX >= me.ns.distance && (me.startDir == 'E' || me.startDir == 'W')) ||
					(me.absDistY >= me.ns.distance && (me.startDir == 'N' || me.startDir == 'S')))) {
				me.ns.activated = true;
				me.callback(me);
			}
		},

		onEnd: function () {
			var me = this;

			if (me.ns.activateOn == 'end' && me.ns.direction.indexOf(me.startDir) != -1 && (
					(me.absDistX >= me.ns.distance && (me.startDir == 'E' || me.startDir == 'W')) ||
					(me.absDistY >= me.ns.distance && (me.startDir == 'N' || me.startDir == 'S')))) {
				me.callback(me);
			}
		}
	}));
};

eventFn.gesture = function (el, type, fn, options) {
	options = options || {};

	eventList.push(new TouchLayer(el, type, fn, {
		onInit: function () {
			var me = this;

			me.ns = {
				scaleThreshold: options.scaleThreshold || 0,
				rotateThreshold: options.rotateThreshold || 0,
				minScale: options.minScale || 0,
				maxScale: options.maxScale || 0,
				applyTransform: options.applyTransform
			};

			me.applyRotate = !!options.rotate;
			me.applyScale = !!options.scale;
		},

		onStart: function () {
			this.ns.activated = false;
		},

		onChange: function () {
			var me = this;

			if (me.ns.applyTransform) {
				me.el.style({ webkitTransform: me.transform });
			}
		},

		onEnd: function () {
			var me = this;

			if (me.applyScale && me.ns.minScale && me.relScale > me.ns.minScale + me.ns.scaleThreshold) {			// Zoom
				me.callback(me);
				me.ns.activated = true;
			} else if (me.applyScale && me.ns.maxScale && me.relScale < me.ns.maxScale - me.ns.scaleThreshold) {	// Pinch
				me.callback(me);
				me.ns.activated = true;
			} else if (me.applyScale && !me.ns.maxScale && !me.ns.minScale && $.abs(me.relScale) > me.ns.scaleThreshold) {								// Scale
				me.callback(me);
				me.ns.activated = true;
			}

			if (me.applyRotate && !me.ns.activated && $.abs(me.relRotation) > me.ns.rotateThreshold) {
				me.callback(me);
			}
		}
	}));
};



/**
 *
 * Main event handler
 *
 */
function TouchLayer (el, type, fn, options) {
	var that = this;

	that.el = $(el);
	that.callback = fn;
	that.type = type;
	that.fn = fn;

	that.options = {
		onInit: function () {},
		onBeforeStart: function () {},
		onStart: function () {},
		onBeforeMove: function () {},
		onMove: function () {},
		onBeforeEnd: function () {},
		onEnd: function () {}
	};

	$.extend(options, that.options);

	that.options.onInit.call(that);

	if (customEvents[type] && customEvents[type].type == 'gesture') {
		that.el.bind('gesturestart', that);
	} else {
		that.el.bind($.startEv, that);
	}
};

TouchLayer.prototype = {
	moveThreshold: 2,		// 2 pixels minimum, default=10
	neededTouches: 1,

	handleEvent: function (e) {
		var that = this;

		switch (e.type) {
			case $.startEv:
				that._start(e);
				break;
			case $.moveEv:
				that._move(e);
				break;
			case $.endEv:
			case $.cancelEv:
				that._end(e);
				break;
			case 'gesturestart':
				that._gestStart(e);
				break;
			case 'gesturechange':
				that._gestChange(e);
				break;
			case 'gestureend':
			case 'gesturecancel':
				that._gestEnd(e);
				break;
		}
	},

	_start: function (e) {
		var that = this,
			point = $.isTouch ? e.touches[0] : e;

		that.fingers = $.isTouch ? e.touches.length : e.ctrlKey ? 2 : 1;

		that.options.onBeforeStart.call(that, e);

		if (that.fingers != that.neededTouches) {
			return;
		}

/*		that.target = e.target;
		while (that.target.nodeType != 1) {
			that.target = that.target.parentNode;
		}*/

		// Position on the screen
		that.x = point.pageX;
		that.y = point.pageY;

		// Start position
		that.startX = point.pageX;
		that.startY = point.pageY;

		// Init angle
//		that.angle = 0;

		// Init distances
		that.deltaX = 0;
		that.deltaY = 0;
		that.distX = 0;
		that.distY = 0;
		that.absDistX = 0;
		that.absDistY = 0;
		that.odometerX = 0;
		that.odometerY = 0;

		// Init directions
		that.dirX = 0;
		that.dirY = 0;
		that.absDirX = 0;
		that.absDirY = 0;
		that.startDir = '';

		// Start time
		that.startTime = e.timeStamp;
		that.currentTime = e.timeStamp;
		that.duration = 0;

		// Init number of strokes
//		that.strokes = 0;

		// We did not move yet
		that.moved = false;
		that.expired = false;

		that.el.bind($.moveEv, that);
		that.el.bind($.endEv, that);
		that.el.bind($.cancelEv, that);

		that.options.onStart.call(that, e);
	},

	_move: function (e) {
		var that = this,
			point = $.isTouch ? e.changedTouches[0] : e,
			oldDirX, oldDirY;

		// Number of finger used
		that.fingers = $.isTouch ? e.touches.length : e.ctrlKey ? 2 : 1;

		that.options.onBeforeMove.call(that, e);

		if (that.fingers != that.neededTouches) {
			return;
		}

		// Distance from previous interpolation
		that.deltaX = that.x - point.pageX;
		that.deltaY = that.y - point.pageY;

		// Position on the screen
		that.x = point.pageX;
		that.y = point.pageY;

		// Distance from start point
		that.distX = that.x - that.startX;
		that.distY = that.y - that.startY;
		that.absDistX = $.abs(that.distX);	// Faster than Math.abs()
		that.absDistY = $.abs(that.distY);

		// Radiants from start point
//		that.angle = Math.atan2(that.touch[i].distY, that.touch[i].distX);

		// Absolute traveled distance
		that.odometerX+= that.deltaX < 0 ? -that.deltaX : that.deltaX;
		that.odometerY+= that.deltaY < 0 ? -that.deltaY : that.deltaY;

		// Direction of the current stroke
		oldDirX = that.dirX;
		oldDirY = that.dirY;
		that.dirX = that.deltaX > 0 ? 1 : -1;
		that.dirY = that.deltaY > 0 ? 1 : -1;

		// Strokes (everytime user changes direction strokes increases)
/*		if (oldDirX != that.dirX || oldDirY != that.dirY) {
			that.strokes++;
		}*/

		// Absolute direction relative to starting point
		that.absDirX = that.distX > 0 ? 1 : -1;
		that.absDirY = that.distY > 0 ? 1 : -1;

		// Intended direction
		if (that.absDistX > that.moveThreshold || that.absDistY > that.moveThreshold && !that.startDir) {
			// Moved with threshold
			that.moved = true;

			if (that.absDistX > that.absDistY + that.moveThreshold/2) {			// Moved horizontally
				that.startDir = that.distX > 0 ? 'E' : 'W';
			} else if (that.absDistY > that.absDistX + that.moveThreshold/2) {	// Moved vertically
				that.startDir = that.distY > 0 ? 'S' : 'N';
			} else {															// Moved diagonally
				that.startDir = that.distY > 0 ? 'S' : 'N';
				that.startDir+= that.distX > 0 ? 'E' : 'W';
			}
		}

		// Event time
		that.currentTime = e.timeStamp;
		if (that.currentTime - that.startTime > 250) {
			that.currentTime = e.timeStamp;
		}

		that.options.onMove.call(that, e);
	},

	_end: function (e) {
		var that = this;

		that.options.onBeforeEnd.call(that, e);

		that.fingers = $.isTouch ? e.touches.length : 0;

		if (that.fingers != 0) {
			return;
		}

		// Event times
		that.duration = e.timeStamp - that.startTime;
		that.velocityX = that.distX / (e.timeStamp - that.currentTime) * 1000;		// pixels per second
		that.velocityY = that.distY / (e.timeStamp - that.currentTime) * 1000;

		that.el.unbind($.moveEv, that);
		that.el.unbind($.endEv, that);
		that.el.unbind($.cancelEv, that);

		that.options.onEnd.call(that, e);
	},


	/**
	 *
	 * Gestures
	 *
	 */
	_gestStart: function (e) {
		var that = this;

		that.el.addClass('gesturing');

		that.scale = 1;
		that.rotation = 0;
		that.transform = '';

		that.startTime = e.timeStamp;
		that.duration = 0;

		// We are using a matrix so not to collide with other transforms
		that.matrix = new WebKitCSSMatrix(that.el.style('-webkit-transform'));

		that.options.onStart.call(that, e);

		that.el.bind('gesturechange', that);
		that.el.bind('gestureend', that);
		that.el.bind('gesturecancel', that);
	},

	_gestChange: function (e) {
		var that = this,
			transform = that.matrix;

		that.relScale = e.scale;
		that.relRotation = e.rotation;

		if (that.applyScale) {
			that.scale*= e.scale;
			transform = transform.scale(e.scale);
		}

		if (that.applyRotate) {
			that.rotation*= e.rotation;
			transform = transform.rotate(e.rotation);
		}

		that.transform = transform;

		that.options.onChange.call(that, e);
	},

	_gestEnd: function (e) {
		var that = this;

		that.el.removeClass('gesturing');

		that.duration = e.timeStamp - that.startTime;

/*
		var rotationVelocity = e.rotation / (that.duration/1000);	// radiants per seconds
		that.rotationMomentum = { length: rotationVelocity * 1.2, time: Math.abs(rotationVelocity / 200) };

		that.el.style({ webkitTransitionDuration: that.rotationMomentum.time + 's', webkitTransform: new WebKitCSSMatrix(that.el.style('-webkit-transform')).rotate(that.rotationMomentum.length).toString() });
*/

		that.el.unbind('gesturechange', that);
		that.el.unbind('gestureend', that);
		that.el.unbind('gesturecancel', that);

		that.options.onEnd.call(that, e);
	},

	destroy: function () {
		var that = this;

		if (customEvents[type].type == 'gesture') {
			that.el.unbind('gesturestart', that);
			that.el.unbind('gesturechange', that);
			that.el.unbind('gestureend', that);
			that.el.unbind('gesturecancel', that);
		} else {
			that.el.unbind($.startEv, that);
			that.el.unbind($.moveEv, that);
			that.el.unbind($.endEv, that);
			that.el.unbind($.cancelEv, that);
		}

		return null;
	}
};


window.gt = $;
})();

