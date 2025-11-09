import React from "react";
export default function CourseCard({title, description}:{title:string; description?:string}){
  return (<article className="course-card"><h3>{title}</h3><p>{description}</p></article>);
}
