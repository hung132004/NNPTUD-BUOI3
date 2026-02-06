// app.js - quản lý bảng sản phẩm
const API_URL = 'https://api.escuelajs.co/api/v1/products'
let products = []
let filtered = []
let currentPage = 1
let perPage = 10
let currentSort = null // {key:'price'|'title', dir:1|-1}

const $ = id => document.getElementById(id)

async function getAll(){
  try{
    const res = await fetch(API_URL)
    if(!res.ok) throw new Error('Fetch error '+res.status)
    products = await res.json()
    // ensure all items have these fields
    products = products.map(p=>({
      id: p.id,
      title: p.title || '',
      price: Number(p.price) || 0,
      images: Array.isArray(p.images)? p.images : (p.image? [p.image] : []),
      category: p.category?.name || '',
      updatedAt: p.updatedAt || p.creationAt || ''
    }))
    // initial render
    applyFiltersAndRender()
  }catch(err){
    console.error('getAll error', err)
    document.querySelector('#productsTable tbody').innerHTML = '<tr><td colspan="5">Không thể tải dữ liệu.</td></tr>'
  }
}

function applyFiltersAndRender(){
  const q = $('search').value.trim().toLowerCase()
  filtered = products.filter(p => p.title.toLowerCase().includes(q))
  $('totalCount').textContent = filtered.length

  if(currentSort){
    const key = currentSort.key
    const dir = currentSort.dir
    filtered.sort((a,b)=>{
      if(key==='price') return (a.price - b.price) * dir
      return a.title.localeCompare(b.title) * dir
    })
  }

  currentPage = Math.min(currentPage, Math.ceil(filtered.length / perPage) || 1)
  renderTable()
  renderPagination()
}

function renderTable(){
  const tbody = document.querySelector('#productsTable tbody')
  tbody.innerHTML = ''
  const start = (currentPage-1)*perPage
  const pageItems = filtered.slice(start, start+perPage)
  if(pageItems.length===0){
    tbody.innerHTML = '<tr><td colspan="5">No products found.</td></tr>'
    return
  }
  for(const p of pageItems){
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${p.images[0] ? `<img src="${p.images[0]}" alt="${escapeHtml(p.title)}" />` : ''}</td>
      <td>${escapeHtml(p.title)}</td>
      <td>$${p.price.toFixed(2)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>${new Date(p.updatedAt).toLocaleString()}</td>
    `
    tbody.appendChild(tr)
  }
}

function renderPagination(){
  const wrap = $('pagination')
  wrap.innerHTML = ''
  const totalPages = Math.ceil(filtered.length / perPage) || 1

  const prev = createPageBtn('Prev', ()=>{ if(currentPage>1){currentPage--; renderTable(); renderPagination()} })
  wrap.appendChild(prev)

  for(let i=1;i<=totalPages;i++){
    const btn = createPageBtn(i, ()=>{ currentPage = i; renderTable(); renderPagination() })
    if(i===currentPage) btn.classList.add('active-page')
    wrap.appendChild(btn)
  }

  const next = createPageBtn('Next', ()=>{ if(currentPage<totalPages){currentPage++; renderTable(); renderPagination()} })
  wrap.appendChild(next)
}

function createPageBtn(text, onClick){
  const b = document.createElement('button')
  b.textContent = text
  b.className = 'page-btn'
  b.addEventListener('click', onClick)
  return b
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"
  }[s]))
}

// controls
$('search').addEventListener('input', ()=>{ currentPage = 1; applyFiltersAndRender() })
$('perPage').addEventListener('change', (e)=>{ perPage = Number(e.target.value); currentPage = 1; applyFiltersAndRender() })

$('sortPriceAsc').addEventListener('click', ()=>{ currentSort = {key:'price', dir:1}; applyFiltersAndRender() })
$('sortPriceDesc').addEventListener('click', ()=>{ currentSort = {key:'price', dir:-1}; applyFiltersAndRender() })
$('sortNameAsc').addEventListener('click', ()=>{ currentSort = {key:'title', dir:1}; applyFiltersAndRender() })
$('sortNameDesc').addEventListener('click', ()=>{ currentSort = {key:'title', dir:-1}; applyFiltersAndRender() })

// init
getAll()

// Exported for testing / external usage
window.getAll = getAll
