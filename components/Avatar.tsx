import { createAvatar } from '@dicebear/avatars';
import * as style from '@dicebear/personas';
import React from "react";

interface Props {
  seed: string,
  className: string,
  alt: string
}

const Avatar: React.FC<Props> = ({ seed, className, alt} : Props) => {

  let svg = createAvatar(style, { seed });
  
  return (
    <div className={className} dangerouslySetInnerHTML={{__html: svg}} title={alt} />
  )
}

export default Avatar;