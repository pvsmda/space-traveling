import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { PostComents } from '../../components/Postcoments';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  afterPost: {
    uid: string;
    title: string;
  };
  beforePost: {
    uid: string;
    title: string;
  };
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post({ post, preview }: PostProps): JSX.Element {
  const router = useRouter();

  const timeReading = post.data.content.reduce((sum, content) => {
    const words = RichText.asText(content.body).split(' ').length;
    return Math.ceil(sum + words / 200);
  }, 0);

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <main className={styles.container}>
      <Header />
      <img className={styles.banner} src={`${post.data.banner.url}`} alt="" />
      <article className={commonStyles.content}>
        <h1>{post.data.title}</h1>

        <div className={commonStyles.info}>
          <FiCalendar />{' '}
          <span>
            <time>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
          </span>
          <FiUser /> <span>{post.data.author}</span>
          <FiClock /> <span>{timeReading} min</span>
        </div>
        <time className={styles.timeEditable}>
          {format(
            new Date(post.last_publication_date),
            "'* editado em' dd MMM yyyy', às 'HH:mm'.'",
            {
              locale: ptBR,
            }
          )}
        </time>
        <section>
          {post.data.content.map(content => (
            <div className={styles.postContent} key={content.heading}>
              <h1>{content.heading}</h1>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </section>

        <div className={styles.postsNavigation}>
          <div>
            {post.beforePost.uid !== '' ? (
              <>
                <h2>{post.beforePost.title}</h2>
                <Link href={`/post/${post.beforePost.uid}`}>
                  <a>Post anterior</a>
                </Link>
              </>
            ) : (
              ''
            )}
          </div>
          <div>
            {post.afterPost.uid !== '' ? (
              <>
                <h2>{post.afterPost.title}</h2>
                <Link href={`/post/${post.afterPost.uid}`}>
                  <a>Próximo post</a>
                </Link>
              </>
            ) : (
              ''
            )}
          </div>
        </div>
        <PostComents />
        {preview && (
          <aside className={commonStyles.buttonPreview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </article>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );
  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));
  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const afterPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { orderings: '[document.first_publication_date]', after: response.id }
  );
  const beforePost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { orderings: '[document.first_publication_date desc]', after: response.id }
  );

  const after = {
    uid: afterPost.results_size > 0 ? afterPost.results[0].uid : '',
    title: afterPost.results_size > 0 ? afterPost.results[0].data.title : '',
  };
  const before = {
    uid: beforePost.results_size > 0 ? beforePost.results[0].uid : '',
    title: beforePost.results_size > 0 ? beforePost.results[0].data.title : '',
  };

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    afterPost: after,
    beforePost: before,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(contentItem => {
        return {
          heading: contentItem.heading,
          body: contentItem.body.map(itemBody => {
            return {
              text: itemBody.text,
              type: itemBody.type,
              spans: [...itemBody.spans],
            };
          }),
        };
      }),
    },
  };

  return {
    props: {
      post,
      preview,
    },
  };
};
