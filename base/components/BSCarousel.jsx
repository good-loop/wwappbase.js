import React, { useState, useEffect } from 'react';
import { Carousel, CarouselControl, CarouselIndicators, CarouselItem } from 'reactstrap';
import { space } from '../utils/miscutils';


/**
 * Wraps the BS Carousel to make it React user friendly.
 */
const BSCarousel = ({className, hasIndicators, light, children }) => {
	const [animating, setAnimating] = useState(false);
	const [index, setIndex] = useState(0);

	// no nulls
	children = children.filter(x => x);

	const next = () => {
		if (animating) return;
		const nextIndex = index === children.length - 1 ? 0 : index + 1;
		setIndex(nextIndex);
	}

	const previous = () => {
		if (animating) return;
		const nextIndex = index === 0 ? children.length - 1 : index - 1;
		setIndex(nextIndex);
	}

	// ?? dots??
	const goToIndex = (newIndex) => {
		if (animating) return;
		setActiveIndex(newIndex);
	};

	return (<Carousel className={space(className,'BSCarousel')}
		activeIndex={index}
		next={next}
		previous={previous}
		interval={false}
	>
		{children.map((content, i) =>
			<CarouselItem
				key={i}
				onExiting={() => setAnimating(true)}
				onExited={() => setAnimating(false)}
			>
				{content}
			</CarouselItem>
		)}
		{hasIndicators && <div className="d-block d-md-none">
			<CarouselIndicators items={children} activeIndex={activeIndex} onClickHandler={goToIndex} />
		</div>}
		<CarouselControl direction="prev" directionText="Previous" onClickHandler={previous} />
		<div className={light&&"text-dark"}>
			<CarouselControl direction="next" directionText="Next" onClickHandler={next} />
		</div>
	</Carousel>)
};

export default BSCarousel;

