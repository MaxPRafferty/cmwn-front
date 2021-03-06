import React from 'react';
import _ from 'lodash';
import Slider from 'react-slick';

import GLOBALS from 'components/globals';

import './featured_games.scss';

const LABELS = {
    ABOUT: 'About this game',
    FLAG: 'Featured Games',
    LEFT: 'Left',
    RIGHT: 'Right'
};

const COMPONENT_UNIQUE_IDENTIFIER = 'featured-games';

class Component extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            current: 0
        };
    }
    componentWillReceiveProps(nextProps) {
        this.setState({titles: this.props.transformData(nextProps.data)});
    }
    renderLeft(props) {
        return (
            <div className="left">
                <button {...props}><span>{'<'}</span></button>
            </div>
        );
    }
    renderRight(props) {
        return (
            <div className="right">
                <button {...props}><span>{'>'}</span></button>
            </div>
        );
    }
    renderSlides() {
        var slides;
        slides = _.map(this.state.titles, i => {
            return (
                <figure
                    className="slide effect-apollo"
                    onClick={this.props.launchGame.bind(null, `${GLOBALS.GAME_URL}${i.game_id}/index.html`)}
                >
                    <div className="slide-container">
                        <object
                            width="650"
                            height="182"
                            className="background"
                            data={`${GLOBALS.MEDIA_URL}titles/18-5/${i.game_id}.jpg`}
                        >
                            <object
                                data={`${GLOBALS.MEDIA_URL}titles/18-5/${i.game_id}.gif`}
                                width="650"
                                height="182"
                            >
                                <object
                                    data={`${GLOBALS.MEDIA_URL}titles/18-5/${i.game_id}.png`}
                                    width="650"
                                    height="182"
                                >
                                    <img
                                        src={`${GLOBALS.MEDIA_URL}titles/18-5/${i.game_id}.jpeg`}
                                        width="650"
                                        height="182"
                                    />
                                </object>
                            </object>
                        </object>
                    </div>
                    <figcaption className="labels">
                        <span className="about">{LABELS.ABOUT}</span>
                        <span>{i.description}</span>
                    </figcaption>
                </figure>
            );
        });
        return slides;
    }
    render() {
        if (this.props.data == null) return null;

        return (
            <div className={COMPONENT_UNIQUE_IDENTIFIER} >
                <object
                    className="hidden-preload"
                    data={`${GLOBALS.MEDIA_URL}PlatformArt/gradients/gradient01.svg`}
                />
                <div className="featured-flag"><span>{LABELS.FLAG}</span></div>
                <Slider
                    arrows={true}
                    autoplay={true}
                    autoplaySpeed={8000}
                    infinite={true}
                    lazyLoad={true}
                    pauseOnHover={true}
                    slidesToShow={1}
                    slidesToScroll={1}
                    prevArrow={this.renderLeft()}
                    nextArrow={this.renderRight()}
                >
                    {this.renderSlides()}
                </Slider>
                <div className="featured-nub"></div>
            </div>
        );
    }
}

Component.defaultProps = {
    launchGame: _.identity,
    transformData: _.identity
};

Component.identifier = COMPONENT_UNIQUE_IDENTIFIER;
export default Component;

