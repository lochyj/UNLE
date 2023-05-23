import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

import example1 from '@site/static/img/example1.png';
import example2 from '@site/static/img/example2.png';
import example3 from '@site/static/img/example3.png';

const FeatureList = [
  {
    title: 'Performant',
    Img: example1,
    description: (
      <>
        UNLE was created to be the fastest in class for network and node graph theory visualization.
      </>
    ),
  },
  {
    title: 'Simple Interface',
    Img: example2,
    description: (
      <>
        UNLE has an extremely simple interface that doesn't take long to master
      </>
    ),
  },
  {
    title: 'Great Visualization Tool',
    Img: example3,
    description: (
      <>
        The idea behind UNLE is being able to visualize network and node graph theory in a simple and performant way.
      </>
    ),
  },
];

function Feature({Img, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img src={Img} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
