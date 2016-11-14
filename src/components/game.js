import React from 'react';
import ReactDOM from 'react-dom';
import Screenfull from 'screenfull';
import ClassNames from 'classnames';
import _ from 'lodash';
import {Button, Glyphicon} from 'react-bootstrap';

import getEventsForGame from 'components/game_events';
import GLOBALS from 'components/globals';
import HttpManager from 'components/http_manager';
import Detector from 'components/browser_detector';

import CHROME_ICON from 'media/Google_Chrome_icon_(2011).svg.png';

import 'components/game.scss';

const EVENT_PREFIX = '_e_';

const FULLSCREEN = 'Full Screen';
const DEMO_MODE = 'Demo Mode';

const PORTRAIT_TEXT = 'Please turn this game into landscape mode to continue.';

/* eslint-disable max-len */
const BROWSER_NOT_SUPPORTED = <span>Sorry! Your browser or device is currently not supported for this game. We are working to add support soon, but until then please try again on a computer with a supported browser. ChangeMyWorldNow reccomends <a href="https://www.google.com/chrome/browser/desktop/index.html" target="_blank">Google Chrome <img src={CHROME_ICON} /></a></span>;
/* eslint-enable max-len */

const COMPONENT_IDENTIFIER = 'game';

/**
 * Game wrapper iframe component.
 * Listens for 'game-event'
 * Has three default events - init, onFlipEarned, and onSave
 * Provides data to component via respond method in details of init event
 * additional arbitrary events can be added by adding additional
 * props prefixed with 'on'. Should the game issue events with
 * these names, any provided callbacks will fire. For example:
 * ```
 * var event = new Event('save', {bubbles: true}, {name: 'save', gameData: {state: {...}}});
 * window.frameElement.dispatchEvent(event)
 * ```
 * note that the component may provide incomplete or empty
 * state data, so any missing properties should be actively
 * regenerated by the game itself.
 */
export class Game extends React.Component {
    constructor() {
        super();

        this.state = {
            fullscreenFallback: false,
            demo: false
        };
    }

    componentWillMount() {
        this.setEvent.call(this);
        this.setState({
            currentGame: this.props.game,
            eventHandler: getEventsForGame(
                EVENT_PREFIX,
                this.props.game,
                this.props.currentUser._links,
                this.onExit.bind(this)
            )
        });
        if (Screenfull.enabled) {
            document.addEventListener(Screenfull.raw.fullscreenchange, () => {
                this.setState({isFullscreen: Screenfull.isFullscreen});
            });
        }
    }

    componentDidMount() {
        var frame = ReactDOM.findDOMNode(this.refs.gameRef);
        var callApi;
        if (!frame) {
            return;
        }

        callApi = _.debounce(function () {
            HttpManager.GET({
                url: (GLOBALS.API_URL),
                handleErrors: false
            });
        }, 5000);
        frame.addEventListener('load', function () {
            frame.contentWindow.addEventListener('click', callApi, false);
        }, false);
        this.checkForPortrait.call(this);
        this.setState({mounted: true});
    }

    componentWillReceiveProps(nextProps) {
        var frame = ReactDOM.findDOMNode(this.refs.gameRef);
        var callApi = _.debounce(function () {
            HttpManager.GET({
                url: (GLOBALS.API_URL),
                handleErrors: false
            });
        }, 10000);
        frame.addEventListener('load', function () {
            frame.contentWindow.addEventListener('click', callApi, false);
        }, false);

        this.setState({
            currentGame: nextProps.game,
            eventHandler: getEventsForGame(
                EVENT_PREFIX,
                nextProps.game,
                nextProps.currentUser._links,
                this.onExit.bind(this)
            )
        });
    }

    componentWillUnmount() {
        this.clearEvent.call(this);
        this.setState({mounted: false});
    }

    onExit(nextState) {
        this.setState(nextState);
    }

    gameEventHandler(e) {
        if (e.name != null) {
            if (_.isFunction(this[EVENT_PREFIX + _.upperFirst(e.name)])) {
                this[EVENT_PREFIX + _.upperFirst(e.name)](...arguments);
            }
            if (_.isFunction(this.state.eventHandler[EVENT_PREFIX + _.upperFirst(e.name)])) {
                this.state.eventHandler[EVENT_PREFIX + _.upperFirst(e.name)](...arguments);
            }
            if (_.isFunction(this.props['on' + _.upperFirst(e.name)])) {
                this.props['on' + _.upperFirst(e.name)](...arguments);
            }
        }
    }

    setEvent() {
        window.addEventListener('game-event', this.gameEventHandler.bind(this));
        window.addEventListener('platform-event', this.gameEventHandler.bind(this));
        window.addEventListener('keydown', this.listenForEsc.bind(this));
        window.addEventListener('resize', this.checkForPortrait.bind(this));
        window.addEventListener('orientationchange', this.resizeFrame.bind(this));
    }

    clearEvent() {
        window.removeEventListener('game-event', this.gameEventHandler);
        window.removeEventListener('keydown', this.listenForEsc);
        window.removeEventListener('resize', this.checkForPortrait);
        window.addEventListener('orientationchange', this.resizeFrame);
    }

    listenForEsc(e) {
        if (e.keyCode === 27 || e.charCode === 27) {
            Screenfull.exit();
            this.setState({
                fullscreenFallback: false,
                isFullscreen: false,
            });
        }
    }

    resizeFrame() {
        var frame;
        if (this.state.mounted) {
            frame = ReactDOM.findDOMNode(this.refs.gameRef);
            if (frame) {
                frame.contentWindow.innerWidth = ReactDOM.findDOMNode(this.refs.wrapRef).offsetWidth;
                frame.contentWindow.innerHeight = ReactDOM.findDOMNode(this.refs.wrapRef).offsetHeight;
            }
            setTimeout(() => {
                this.dispatchPlatformEvent.call(this, 'resize');
            }, 1000);
        }
    }

    dispatchPlatformEvent(name, data) {
        var frame;
        var event;
        /** TODO: MPR, 1/15/16: Polyfill event */
        if (this.state.mounted) {
            frame = ReactDOM.findDOMNode(this.refs.gameRef);
            event = new Event('platform-event', {bubbles: true, cancelable: false});
            this.toggleDemoButton.call(this);
            _.defaults(event, {type: 'platform-event', name, data});
            if (frame) frame.contentWindow.dispatchEvent(event);
        }
    }

    makeFullScreen() {
        var nextState = {isFullscreen: true};
        if (Screenfull.enabled) {
            Screenfull.request(ReactDOM.findDOMNode(this.refs.wrapRef));
        } else {
            nextState.fullscreenFallback = true;
            this.resizeFrame().call(this);
        }
        this.setState(nextState);
    }

    checkForPortrait() {
        var isPortrait = (Detector.isMobileOrTablet() && Detector.isPortrait());
        this.setState({isPortrait});
    }

    toggleDemoButton() {
        this.state.demo ? this.setState({demo: false}) : this.setState({demo: true});
    }

    render() {
        if (this.props.url == null) return null;
        if (Detector.isIe()) {
            return BROWSER_NOT_SUPPORTED;
        }
        return (
            <div className={COMPONENT_IDENTIFIER}>
                <div ref="wrapRef" className={ClassNames(
                    'game-frame-wrapper',
                    {fs: this.state.isFullscreen, fullscreen: this.state.fullscreenFallback}
                )}>
                    <div
                        ref="overlay"
                        className={ClassNames('overlay', {
                            portrait: this.state.isPortrait,
                            fullscreen: Screenfull.isFullscreen
                        })}
                    >
                        <p>{PORTRAIT_TEXT}</p>
                    </div>
                    <iframe
                        ref="gameRef"
                        className={ClassNames('game-frame', {
                            portrait: this.state.isPortrait
                        })}
                        src={this.props.url}
                        allowTransparency="true"
                    />
                </div>
                <Button
                    onClick={this.makeFullScreen.bind(this)}
                    className={ClassNames('purple', 'standard', 'full-screen-btn', {
                        hidden: this.state.isPortrait
                    })}
                >
                    <Glyphicon glyph="fullscreen" /> {FULLSCREEN}
                </Button>
                <Button
                    className={ClassNames('standard',
                        {'purple': !this.state.demo},
                        {'green': this.state.demo},
                        {hidden: !this.props.isTeacher || this.props.game === 'skribble'}
                    )}
                    onClick={this.dispatchPlatformEvent.bind(this, 'toggle-demo-mode')}
                >
                    {DEMO_MODE}
                </Button>
            </div>
        );
    }

}

Game.defaultProps = _.defaults({
    onFlipEarned: _.noop,
    onSave: _.noop,
    isTeacher: false,
    gameState: {}
}, React.Component.defaultProps);


export default Game;

