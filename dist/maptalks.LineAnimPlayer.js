/*!
 * maptalks.LineAnimPlayer v2.0.2
 * LICENSE : MIT
 * (c) 2016-2017 maptalks.org
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks')) :
	typeof define === 'function' && define.amd ? define(['exports', 'maptalks'], factory) :
	(factory((global.maptalks = global.maptalks || {}),global.maptalks));
}(this, (function (exports,maptalks) { 'use strict';

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

/**
 * @property {Object} [options=null]
 * @property {String} [options.antiMeridian=continuous] - how to deal with the anti-meridian problem, split or continue the linestring when it cross the 180 or -180 longtitude line.
 * @property {String} [options.arrowStyle=null]                 - style of arrow, if not null, arrows will be drawn, possible values: classic
 * @property {String} [options.arrowPlacement=vertex-last]      - arrow's placement: vertex-first, vertex-last, vertex-firstlast, point
 * @memberOf LineString
 * @instance
*/
var options = {
    'arrowStyle': null,
    'arrowPlacement': 'vertex-last' //vertex-first, vertex-last, vertex-firstlast, point
};

/**
 * Represents a LineAnimPlayer type Geometry.
  * @category geometry
 * @extends LineString
 * @example
 *
 *
 *
 *
 *
*/
var LineAnimPlayer = function (_maptalks$LineString) {
    _inherits(LineAnimPlayer, _maptalks$LineString);

    /**
    * @param {Coordinate[]|Number[][]} coordinates - coordinates of the line string
    * @param {Object} [options=null] - construct options defined in [LineString]{@link LineString#options}
    */
    function LineAnimPlayer(coordinates, options) {
        _classCallCheck(this, LineAnimPlayer);

        var _this = _possibleConstructorReturn(this, _maptalks$LineString.call(this, coordinates, options));

        _this.type = 'LineAnimPlayer';
        return _this;
    }

    LineAnimPlayer.prototype.createPlayer = function createPlayer() {
        var _this2 = this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var cb = arguments[1];

        if (maptalks.Util.isFunction(options)) {
            options = {};
            cb = options;
        }
        //const coordinates = this.getCoordinates();
        this.totalCoordinates = this.getCoordinates();
        var duration = options['duration'] || 1000;
        this.duration = duration;
        //const length = this.getLength();
        this.totalLength = this.getLength();
        var easing = options['easing'] || 'out';
        this.unitTime = options['unitTime'] || 1;
        this.aniCallback = cb;
        this.setCoordinates([]);
        this.played = 0;
        var player = maptalks.animation.Animation.animate({
            't': [0, 1]
        }, {
            'duration': this.duration,
            'easing': easing
        }, function (frame) {
            _this2._step(frame);
        });
        this.player = player;
        return this;
    };

    LineAnimPlayer.prototype._step = function _step(frame) {
        this.played = this.duration * frame.styles.t;
        var length = this.totalLength;
        var coordinates = this.totalCoordinates;
        if (!this.getMap()) {
            this.player.finish();
            this.setCoordinates(coordinates);
            if (this.aniCallback) {
                this.aniCallback(frame, coordinates[coordinates.length - 1], length - 1);
            }
            return;
        }
        var animCoords = this._drawAnimFrame(frame.styles.t, this.duration, length, coordinates);
        var currentCoordinate = animCoords ? animCoords[animCoords.length - 1] : coordinates[0];
        if (this.aniCallback) {
            this.aniCallback(frame, currentCoordinate, this._animIdx);
        }
    };

    LineAnimPlayer.prototype.setSpeed = function setSpeed(t) {
        this.unitTime = this.unitTime * t;
        this._resetPlayer();
    };

    LineAnimPlayer.prototype._resetPlayer = function _resetPlayer() {
        var playing = this.player && this.player.playState === 'running';
        if (playing) {
            this.player.pause();
        }
        this._createPlayer();
        if (playing) {
            this.player.play();
        }
    };

    LineAnimPlayer.prototype._createPlayer = function _createPlayer() {
        var duration = (this.duration - this.played) / this.unitTime;
        //this.player.pause();
        this.player = maptalks.animation.Animation.animate({ 't': [this.played / this.duration, 1] }, { 'speed': duration, 'easing': 'linear' }, function (frame) {
            this._step(frame);
        }.bind(this));
    };

    LineAnimPlayer.prototype.cancel = function cancel() {
        if (this.player) {
            this.played = 0;
            this._animIdx = 0;
            this._animLenSoFar = 0;
            this._createPlayer();
            this.player.cancel();
            this._step({ 'styles': { 't': 0 } });
            this.fire('playcancel');
            return this;
        }
        return null;
    };

    LineAnimPlayer.prototype.play = function play() {
        if (this.player) {
            this.player.play();
            this.fire('playstart');
            return this;
        } else {
            console.log('You should call createPlayer method to play it!');
            return this;
        }
    };

    LineAnimPlayer.prototype.pause = function pause() {
        this.player.pause();
        this.fire('playpause');
        return this;
    };

    LineAnimPlayer.prototype.finish = function finish() {
        this.player.finish();
        //this._step({ 'styles': { 't': 1 }});
        this.fire('playfinish');
        return this;
    };

    LineAnimPlayer.prototype._drawAnimFrame = function _drawAnimFrame(t, duration, length, coordinates) {
        if (t === 0) {
            this.setCoordinates([]);
            return null;
        }
        var map = this.getMap();
        var targetLength = t * length;
        if (!this._animIdx) {
            this._animIdx = 0;
            this._animLenSoFar = 0;
            this.show();
        }
        var i, l;
        var segLen = 0;
        for (i = this._animIdx, l = coordinates.length; i < l - 1; i++) {
            segLen = map.computeLength(coordinates[i], coordinates[i + 1]);
            if (this._animLenSoFar + segLen > targetLength) {
                break;
            }
            this._animLenSoFar += segLen;
        }
        this._animIdx = i;
        if (this._animIdx >= l - 1) {
            this.setCoordinates(coordinates);
            this.unitTime = 1;
            this.fire('playfinish');
            return coordinates;
        }
        this.fire('playing');
        var idx = this._animIdx;
        var p1 = coordinates[idx],
            p2 = coordinates[idx + 1],
            span = targetLength - this._animLenSoFar,
            r = span / segLen;
        var x = p1.x + (p2.x - p1.x) * r,
            y = p1.y + (p2.y - p1.y) * r,
            targetCoord = new maptalks.Coordinate(x, y);
        var animCoords = coordinates.slice(0, this._animIdx + 1);
        animCoords.push(targetCoord);
        this.setCoordinates(animCoords);
        return animCoords;
    };

    return LineAnimPlayer;
}(maptalks.LineString);

LineAnimPlayer.mergeOptions(options);

LineAnimPlayer.registerJSONType('LineAnimPlayer');

exports.LineAnimPlayer = LineAnimPlayer;

Object.defineProperty(exports, '__esModule', { value: true });

})));
