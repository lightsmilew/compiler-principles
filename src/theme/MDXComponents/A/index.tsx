import type {ReactNode} from 'react';
import MDXA from '@theme-original/MDXComponents/A';
import type {Props} from '@theme/MDXComponents/A';

// Course attachments are same-origin static files; keep their download behavior
// consistent wherever Markdown links appear, including under a deployment baseUrl.
const attachmentPath = /\/(?:pdf|word|downloads)\/[^/?#]+\.(?:pdf|docx?|a)(?:[?#]|$)/i;

export default function AttachmentAwareLink(props: Props): ReactNode {
  const href = props.href?.replace(/^pathname:\/\//, '');
  if (href && !/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(href)
      && attachmentPath.test(href)) {
    return <MDXA {...props} download={props.download ?? true} target="_self" />;
  }
  return <MDXA {...props} />;
}
