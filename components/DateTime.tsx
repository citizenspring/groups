
import React from "react";
import moment from "moment";

interface Props {
  data: string,
}

const DateTime: React.FC<Props> = ({ data } : Props) => {
  
  return (
    <time className="" dateTime={moment(data).format('MMMM Do YYYY, h:mm:ss a')}
  title={moment(data).format('MMMM Do YYYY, h:mm:ss a')}>{moment(data).fromNow()}</time>

    )
}

export default DateTime;

