const seed={books:[{title:'بين الواقع والحلم',desc:'قصص من الحياة'},{title:'بدايات جديدة',desc:'قصة أمل'},{title:'رحلة أعماق النفس',desc:'خواطر وتأملات'}],videos:[{title:'رسالة أمل',url:'https://www.tiktok.com/',desc:'مقطع قصير عن أهمية الأمل في حياتنا'}],news:[{title:'خطوات جديدة في مشروعي القادم',date:'2026-09-22'},{title:'معنى الكتابة في زمن السرعة',date:'2026-09-18'},{title:'أهمية القراءة في بناء الشخصية',date:'2026-09-12'}],comments:[{name:'أحمد محمود',text:'موقع رائع ومحتوى مميز. تمنيت لك مزيدًا من الإبداع.'}],links:[['موقعي الشخصي','#'],['تيك توك','https://www.tiktok.com/'],['يوتيوب','https://www.youtube.com/'],['تيليجرام','https://t.me/'],['موقع خاص','#']]};
const key='nabil-author-site-v1';let data=JSON.parse(localStorage.getItem(key)||'null')||seed;
const $=id=>document.getElementById(id);const save=()=>{localStorage.setItem(key,JSON.stringify(data));render()};
function render(){
 $('year').textContent=new Date().getFullYear();
 $('booksGrid').innerHTML=data.books.map((b,i)=>`<article class="book"><div class="book-cover">${b.title}</div><h3>${b.title}</h3><p>${b.desc||''}</p><button class="primary" style="font-size:11px;padding:7px 12px" onclick="alert('يمكن ربط هذه الصفحة بملف الكتاب وصفحاته عند تركيب النظام النهائي.')">عرض الكتاب</button></article>`).join('');
 $('videosGrid').innerHTML=data.videos.map(v=>`<article class="video"><div class="video-thumb">▶</div><div class="video-info"><h3>${v.title}</h3><p>${v.desc||''}</p><a href="${v.url||'#'}" target="_blank" rel="noopener">فتح رابط الفيديو</a></div></article>`).join('');
 $('newsList').innerHTML=data.news.map(n=>`<article class="news-item"><div class="news-thumb"></div><div><h3>${n.title}</h3><time>${n.date||''}</time></div></article>`).join('');
 $('commentsList').innerHTML=data.comments.map(c=>`<div class="comment"><strong>${c.name}</strong><p>${c.text}</p></div>`).join('');
 $('linksGrid').innerHTML=data.links.map(l=>`<a class="link" href="${l[1]}" target="_blank" rel="noopener">🔗 ${l[0]}</a>`).join('');
 $('photosGrid').innerHTML=[1,2,3,4].map(i=>`<div class="photo"><img src="assets/author.jpg" alt="صورة الكاتب"></div>`).join('');
}
render();
$('commentForm').addEventListener('submit',e=>{e.preventDefault();data.comments.unshift({name:$('commentName').value,text:$('commentText').value});e.target.reset();save()});
$('messageForm').addEventListener('submit',e=>{e.preventDefault();alert('تم حفظ الرسالة محليًا في هذه النسخة التجريبية. عند ربط الخادم ستصل الرسائل إلى بريدك/لوحة التحكم.');e.target.reset()});
$('openAdmin').onclick=()=>{ $('adminModal').classList.add('show')};$('closeAdmin').onclick=()=>{$('adminModal').classList.remove('show')};$('adminModal').addEventListener('click',e=>{if(e.target.id==='adminModal')$('adminModal').classList.remove('show')});
document.querySelectorAll('.tabs button').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.tab-panel').forEach(p=>p.classList.add('hidden'));$(btn.dataset.tab).classList.remove('hidden')});
$('bookForm').addEventListener('submit',e=>{e.preventDefault();data.books.unshift({title:$('bookTitle').value,desc:$('bookDesc').value});e.target.reset();save()});
$('newsForm').addEventListener('submit',e=>{e.preventDefault();data.news.unshift({title:$('newsTitle').value,date:new Date().toISOString().slice(0,10)});e.target.reset();save()});
$('videoForm').addEventListener('submit',e=>{e.preventDefault();data.videos.unshift({title:$('videoTitle').value,url:$('videoUrl').value,desc:'فيديو جديد'});e.target.reset();save()});
$('resetData').onclick=()=>{if(confirm('إعادة المحتوى التجريبي؟')){data=structuredClone(seed);save()}};
