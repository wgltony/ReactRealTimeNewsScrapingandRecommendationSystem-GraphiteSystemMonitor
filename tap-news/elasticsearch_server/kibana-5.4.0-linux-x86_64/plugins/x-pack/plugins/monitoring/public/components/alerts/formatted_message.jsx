import React from 'react';

export default function FormattedMessage({ prefix, suffix, message, metadata, angularChangeUrl }) {
  const goToLink = () => {
    if (metadata && metadata.link) {
      angularChangeUrl(`/${metadata.link}`);
    }
  };
  const formattedMessage = (() => {
    if (metadata.link) {
      return (
        <a onClick={goToLink} className='alert-message__clickable'>
          {message}
        </a>
      );
    }
    return message;
  })();

  // suffix and prefix don't contain spaces
  const formattedPrefix = prefix ? `${prefix} ` : null;
  const formattedSuffix = suffix ? ` ${suffix}` : null;
  return (
    <span>
      {formattedPrefix}
      {formattedMessage}
      {formattedSuffix}
    </span>
  );
}
