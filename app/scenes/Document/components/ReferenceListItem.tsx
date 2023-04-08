import { observer } from "mobx-react";
import { DocumentIcon } from "outline-icons";
import * as React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { NavigationNode } from "@shared/types";
import parseTitle from "@shared/utils/parseTitle";
import Document from "~/models/Document";
import Flex from "~/components/Flex";
import EmojiIcon from "~/components/Icons/EmojiIcon";
import { ellipsis, hover } from "~/styles";
import { sharedDocumentPath } from "~/utils/routeHelpers";

type Props = {
  shareId?: string;
  document: Document | NavigationNode;
  anchor?: string;
  showCollection?: boolean;
};

const DocumentLink = styled(Link)`
  display: block;
  margin: 2px -8px;
  padding: 6px 8px;
  border-radius: 8px;
  max-height: 50vh;
  min-width: 100%;
  overflow: hidden;
  position: relative;
  cursor: var(--pointer);

  &:${hover},
  &:active,
  &:focus {
    background: ${(props) => props.theme.listItemHoverBackground};
  }
`;

const Content = styled(Flex)`
  color: ${(props) => props.theme.textSecondary};
  margin-left: -4px;
`;

const Title = styled.div`
  ${ellipsis()}
  font-size: 14px;
  font-weight: 500;
  line-height: 1.25;
  padding-top: 3px;
  color: ${(props) => props.theme.text};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
`;

function ReferenceListItem({
  document,
  showCollection,
  anchor,
  shareId,
  ...rest
}: Props) {
  const { emoji } = parseTitle(document.title);

  return (
    <DocumentLink
      to={{
        pathname: shareId
          ? sharedDocumentPath(shareId, document.url)
          : document.url,
        hash: anchor ? `d-${anchor}` : undefined,
        state: {
          title: document.title,
        },
      }}
      {...rest}
    >
      <Content gap={4} dir="auto">
        {emoji ? (
          <EmojiIcon emoji={emoji} />
        ) : (
          <DocumentIcon color="currentColor" />
        )}
        <Title>
          {emoji ? document.title.replace(emoji, "") : document.title}
        </Title>
      </Content>
    </DocumentLink>
  );
}

export default observer(ReferenceListItem);
