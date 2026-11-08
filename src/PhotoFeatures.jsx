import React from 'react';
import { Icon } from './Art.jsx';
import { Link } from './Navigation.jsx';
import checkoutPhoto from './assets/merchant-checkout.webp';
import businessPhoto from './assets/business-review.webp';

const photoStories = [
  {
    page: 'merchant',
    image: checkoutPhoto,
    height: 533,
    kicker: 'Merchant services',
    title: 'Make checkout simple',
    description: 'See how a card payment moves from the checkout counter to a business’s records.',
    link: 'Explore payment solutions',
    alt: 'A barista holding a card beside a payment terminal at a café counter',
  },
  {
    page: 'knowledge',
    image: businessPhoto,
    height: 450,
    kicker: 'Business resources',
    title: 'Explore the Business Knowledge Center',
    description: 'Browse practical guides on cash flow, customer payments, and keeping track of business expenses.',
    link: 'Visit the Knowledge Center',
    alt: 'Two people reviewing a laptop and documents at a café table',
  },
];

export function BusinessPhoto({ page, eager = false }) {
  const story = photoStories.find(item => item.page === page);
  return <div className={'business-photo business-photo--' + story.page}>
    <img src={story.image} alt={story.alt} width="800" height={story.height} loading={eager ? 'eager' : 'lazy'} decoding="async" />
  </div>;
}

export function PhotoFeatures() {
  return <section className="shell photo-features" aria-label="Business features">
    {photoStories.map((story, index) =>
      <article className={'photo-feature' + (index === 0 ? ' photo-feature--reverse' : '')} key={story.page}>
        <BusinessPhoto page={story.page} />
        <div className="photo-feature-copy">
          <p className="eyebrow">{story.kicker}</p>
          <h2>{story.title}</h2>
          <p>{story.description}</p>
          <Link page={story.page} className="button button-primary">{story.link} <Icon name="arrow" /></Link>
        </div>
      </article>
    )}
  </section>;
}
