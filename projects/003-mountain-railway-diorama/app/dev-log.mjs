import {developmentRecords} from './development-records.mjs';
const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e};
for(const [i,r] of developmentRecords.entries()){
 const link=text('a',r.id.toUpperCase());link.href='#'+r.id;document.querySelector('#versions').append(link);
 const article=document.createElement('article');article.id=r.id;
 const meta=text('div',`${r.id.toUpperCase()} · ${r.date} · ${r.status}  /  ${r.tags.join('、')}`,'meta');article.append(meta,text('h2',r.title),text('p',r.goal));
 const details=document.createElement('details');details.open=i===0;details.append(text('summary',i===0?'实现过程与验证依据':'展开实现过程与验证依据'),text('p',r.reason,'reason'));
 for(const [key,label] of [['steps','实现顺序与选择'],['fixes','发现的问题与修正'],['validation','实际验证'],['limits','当前边界']]){details.append(text('h3',label));const list=document.createElement(key==='steps'?'ol':'ul');r[key].forEach(v=>list.append(text('li',v)));details.append(list);}
 details.append(text('h3','对应实现'),text('p',r.files.join(' · '),'files'));
 if(r.image){const gallery=document.createElement('div');gallery.className=r.beforeImage?'image-comparison':'';
  for(const [file,label] of [[r.beforeImage,'修改前'],[r.image,r.beforeImage?'修改后':r.id.toUpperCase()]].filter(([file])=>file)){const figure=document.createElement('figure'),img=document.createElement('img');img.src='../assets/'+file;img.alt=label+' · '+r.title+'：实际浏览器截图';img.loading='lazy';figure.append(img,text('figcaption',label+' · 实际本地画面；动画帧不同。'));gallery.append(figure);}details.append(gallery);
 }
 if(r.gallery){const collection=document.createElement('details');collection.append(text('summary','展开四季与光线实景对照'));const grid=document.createElement('div');grid.className='image-comparison';for(const item of r.gallery){const figure=document.createElement('figure'),img=document.createElement('img');img.src='../assets/'+item.image;img.alt=item.label+'：实际浏览器截图';img.loading='lazy';figure.append(img,text('figcaption',item.label));grid.append(figure);}collection.append(text('p','同一景观使用相同全景机位，季节与光线按图注变化；动画帧不同。','provenance'),grid);details.append(collection);}
 article.append(details);document.querySelector('#records').append(article);
}
