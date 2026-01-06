import React, { useState, useEffect } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw, convertFromHTML } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

function RichTextEditor({ value, onChange, placeholder }) {
  const [editorState, setEditorState] = useState(() => {
    if (value) {
      const blocksFromHTML = convertFromHTML(value);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      return EditorState.createWithContent(contentState);
    }
    return EditorState.createEmpty();
  });

  useEffect(() => {
    if (!value && editorState.getCurrentContent().hasText()) {
      setEditorState(EditorState.createEmpty());
    }
  }, [value]);

  const onEditorStateChange = (newEditorState) => {
    setEditorState(newEditorState);
    const html = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
    onChange(html);
  };

  return (
    <div className="rich-text-editor border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
      <Editor
        editorState={editorState}
        onEditorStateChange={onEditorStateChange}
        placeholder={placeholder}
        toolbar={{
          options: ['inline', 'list', 'link'],
          inline: {
            options: ['bold', 'italic', 'underline'],
          },
          list: {
            options: ['unordered', 'ordered'],
          },
        }}
        editorClassName="px-4 py-2 min-h-[200px] text-gray-900 dark:text-gray-100"
        toolbarClassName="border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
      />
    </div>
  );
}

export default RichTextEditor;