import { useEffect, useRef } from 'react';

import styles from './styles.module.scss';

export function PostComents() {
  const commentBox = useRef(null);
  useEffect(() => {
    const scriptEl = document.createElement('script');
    scriptEl.setAttribute('src', 'https://utteranc.es/client.js');
    scriptEl.setAttribute('crossorigin', 'anonymous');
    scriptEl.setAttribute('async', 'true');
    scriptEl.setAttribute(
      'repo',
      'pvsmda/challenge05-react-ignite-spacetraveling'
    );
    scriptEl.setAttribute('issue-term', 'pathname');
    scriptEl.setAttribute('theme', 'github-dark');
    commentBox.current.appendChild(scriptEl);
  }, []);

  return <div ref={commentBox} />;
}
