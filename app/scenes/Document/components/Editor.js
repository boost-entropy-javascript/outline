// @flow
import * as React from 'react';
import styled from 'styled-components';
import Editor from 'components/Editor';
import Placeholder from 'rich-markdown-editor/lib/components/Placeholder';
import ClickablePadding from 'components/ClickablePadding';
import plugins from './plugins';

type Props = {
  defaultValue?: string,
  readOnly?: boolean,
};

class DocumentEditor extends React.Component<Props> {
  editor: *;

  componentDidMount() {
    if (!this.props.defaultValue) {
      setImmediate(this.focusAtStart);
    }
  }

  focusAtStart = () => {
    if (this.editor) this.editor.focusAtStart();
  };

  focusAtEnd = () => {
    if (this.editor) this.editor.focusAtEnd();
  };

  render() {
    const { readOnly, defaultValue } = this.props;

    return (
      <React.Fragment>
        <StyledEditor
          ref={ref => (this.editor = ref)}
          plugins={plugins}
          options={{ normalize: !defaultValue }}
          defaultValue={defaultValue}
          {...this.props}
        />
        <ClickablePadding
          onClick={!readOnly ? this.focusAtEnd : undefined}
          grow
        />
      </React.Fragment>
    );
  }
}

const StyledEditor = styled(Editor)`
  justify-content: start;

  p {
    ${Placeholder} {
      visibility: hidden;
    }
  }
  p:nth-child(2):last-child {
    ${Placeholder} {
      visibility: visible;
    }
  }
`;

export default DocumentEditor;
