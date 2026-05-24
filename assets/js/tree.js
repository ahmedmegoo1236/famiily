/**
 * محرك رسم شجرة العائلة التفاعلية (D3.js Family Tree Masterpiece)
 * -------------------------------------------------------------
 * إعداد المهندس/ أحمد مجاهد رجب
 */

let treeSvg = null;
let treeZoomBehavior = null;
let treeRootData = null;
let treeSvgGroup = null;

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('tree-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleTreeSearchInput);
  }
  
  document.addEventListener('click', (e) => {
    const suggestions = document.getElementById('tree-search-suggestions');
    if (suggestions && !e.target.closest('#tree-search-input') && !e.target.closest('#tree-search-suggestions')) {
      suggestions.classList.add('hidden');
    }
  });
});

// بناء هيكلية الشجرة ديناميكياً من data.js
function buildGenealogyTree() {
  const rootMale = FAMILY_DATA.find(p => p.id === 'ragab_megahed');
  const rootFemale = FAMILY_DATA.find(p => p.id === 'nafisa_metwally');
  
  if (!rootMale) return null;
  return buildFamilyUnitNode(rootMale, rootFemale);
}

// بناء عقدة الوحدة العائلية بشكل متداخل وآمن
function buildFamilyUnitNode(person, spouse = null) {
  let nodeId = person.id;
  let displayName = person.name;
  
  if (spouse) {
    nodeId = `${person.id}_spouse_${spouse.id}`;
    displayName = `${person.name} + ${spouse.name}`;
  }
  
  const unit = {
    id: nodeId,
    name: displayName,
    husband: person.gender === 'male' ? person : spouse,
    wife: person.gender === 'female' ? person : spouse,
    children: []
  };
  
  // تجميع الأبناء
  const childrenPersons = FAMILY_DATA.filter(p => {
    const matchFather = unit.husband && p.fatherId === unit.husband.id;
    const matchMother = unit.wife && p.motherId === unit.wife.id;
    return matchFather || matchMother;
  });
  
  // بناء فروع الأبناء تكرارياً
  childrenPersons.forEach(child => {
    let childSpouse = null;
    if (child.spouseId) {
      childSpouse = FAMILY_DATA.find(p => p.id === child.spouseId);
    }
    
    const childUnit = buildFamilyUnitNode(child, childSpouse);
    unit.children.push(childUnit);
  });
  
  return unit;
}

// رندرة الشجرة الأساسية D3
function renderFamilyTree() {
  const container = document.getElementById('tree-svg-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const treeData = buildGenealogyTree();
  if (!treeData) {
    container.innerHTML = `
      <div class="h-full flex items-center justify-center text-secondary">
        <p>عذراً! لم نتمكن من العثور على جذور شجرة العائلة في ملف البيانات.</p>
      </div>
    `;
    return;
  }
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  const svg = d3.create('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'hidden')
    .style('cursor', 'grab');
    
  treeSvg = svg;
  
  const g = svg.append('g').attr('class', 'tree-viewport');
  treeSvgGroup = g;
  
  treeZoomBehavior = d3.zoom()
    .scaleExtent([0.15, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
    
  svg.call(treeZoomBehavior);
  
  treeRootData = d3.hierarchy(treeData);
  
  // طي الفروع العميقة تلقائياً
  treeRootData.descendants().forEach(d => {
    d.id = d.data.id;
    d._children = d.children;
    if (d.depth > 1) {
      d.children = null;
    }
  });
  
  container.appendChild(svg.node());
  
  updateTreeLayout(treeRootData, width, height);
  resetTreeZoom();
}

// تحديث الشجرة وتطبيق الحركات الانسيابية
function updateTreeLayout(source, viewWidth, viewHeight) {
  const nodeWidth = 240;
  const nodeHeight = 85;
  const levelSpacing = 180;
  
  const treemap = d3.tree().nodeSize([280, levelSpacing]);
  treemap(treeRootData);
  
  const nodes = treeRootData.descendants();
  const links = treeRootData.links();
  
  nodes.forEach(d => {
    d.y = d.depth * levelSpacing;
  });
  
  // 1. رسم خطوط الربط المنحنية
  const linkSelection = treeSvgGroup.selectAll('path.tree-link')
    .data(links, d => d.target.id);
    
  const linkEnter = linkSelection.enter().append('path')
    .attr('class', 'tree-link')
    .attr('d', d => {
      const o = { x: source.x, y: source.y };
      return diagonalCurve(o, o);
    });
    
  const linkUpdate = linkEnter.merge(linkSelection);
  linkUpdate.transition()
    .duration(450)
    .attr('d', d => diagonalCurve(d.source, d.target));
    
  linkSelection.exit().transition()
    .duration(450)
    .attr('d', d => {
      const o = { x: source.x, y: source.y };
      return diagonalCurve(o, o);
    })
    .remove();
    
  // 2. رسم العقد وكروت العائلات
  const nodeSelection = treeSvgGroup.selectAll('g.tree-node-group')
    .data(nodes, d => d.id);
    
  const nodeEnter = nodeSelection.enter().append('g')
    .attr('class', 'tree-node-group fade-in-up')
    .attr('transform', d => `translate(${source.x0 || source.x}, ${source.y0 || source.y})`);
    
  // الكبسولة الكرتونية
  nodeEnter.append('rect')
    .attr('class', 'couple-box')
    .attr('width', nodeWidth)
    .attr('height', nodeHeight)
    .attr('x', -nodeWidth / 2)
    .attr('y', -nodeHeight / 2);
    
  // رسم الفاصل المنقط للأزواج
  nodeEnter.filter(d => d.data.husband && d.data.wife)
    .append('line')
    .attr('x1', 0)
    .attr('y1', -nodeHeight / 2 + 10)
    .attr('x2', 0)
    .attr('y2', nodeHeight / 2 - 10)
    .attr('stroke', 'var(--border-color)')
    .attr('stroke-width', '1px')
    .attr('stroke-dasharray', '3,3');

  // كتابة بيانات الزوج (اليمين) - مع التحقق الآمن لعدم رمي أخطاء برمجة
  const husbandGroup = nodeEnter.append('g')
    .attr('class', 'husband-subnode')
    .filter(d => d.data.husband)
    .on('click', (event, d) => {
      event.stopPropagation();
      if (d.data.husband) openDetailsModal(d.data.husband.id);
    });
    
  husbandGroup.append('rect')
    .attr('width', nodeWidth / 2 - 10)
    .attr('height', nodeHeight - 10)
    .attr('x', 5)
    .attr('y', -nodeHeight / 2 + 5)
    .attr('fill', 'transparent')
    .style('cursor', 'pointer');
    
  husbandGroup.append('text')
    .attr('x', nodeWidth / 4 + 5)
    .attr('y', -8)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--text-primary)')
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .text(d => d.data.husband ? d.data.husband.name : '');
    
  husbandGroup.append('text')
    .attr('x', nodeWidth / 4 + 5)
    .attr('y', 14)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--text-secondary)')
    .attr('font-size', '10px')
    .text(d => (d.data.husband && d.data.husband.surname) ? d.data.husband.surname.split(' ')[0] : '');
    
  husbandGroup.append('text')
    .attr('x', nodeWidth / 4 + 5)
    .attr('y', 28)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--accent-gold)')
    .attr('font-size', '9px')
    .attr('font-weight', '600')
    .text('الزوج');

  // كتابة بيانات الزوجة (اليسار) - مع التحقق الآمن لعدم رمي أخطاء برمجة
  const wifeGroup = nodeEnter.append('g')
    .attr('class', 'wife-subnode')
    .filter(d => d.data.wife)
    .on('click', (event, d) => {
      event.stopPropagation();
      if (d.data.wife) openDetailsModal(d.data.wife.id);
    });
    
  wifeGroup.append('rect')
    .attr('width', nodeWidth / 2 - 10)
    .attr('height', nodeHeight - 10)
    .attr('x', -nodeWidth / 2 + 5)
    .attr('y', -nodeHeight / 2 + 5)
    .attr('fill', 'transparent')
    .style('cursor', 'pointer');
    
  wifeGroup.append('text')
    .attr('x', -nodeWidth / 4 - 5)
    .attr('y', -8)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--text-primary)')
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .text(d => d.data.wife ? d.data.wife.name : '');
    
  wifeGroup.append('text')
    .attr('x', -nodeWidth / 4 - 5)
    .attr('y', 14)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--text-secondary)')
    .attr('font-size', '10px')
    .text(d => (d.data.wife && d.data.wife.surname) ? d.data.wife.surname.split(' ')[0] : '');
    
  wifeGroup.append('text')
    .attr('x', -nodeWidth / 4 - 5)
    .attr('y', 28)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--accent-gold)')
    .attr('font-size', '9px')
    .attr('font-weight', '600')
    .text('الزوجة');

  // في حال العقدة لشخص فرد غير متزوج
  const singleGroup = nodeEnter.append('g')
    .attr('class', 'single-subnode')
    .filter(d => !d.data.spouseId && (!d.data.husband || !d.data.wife))
    .on('click', (event, d) => {
      event.stopPropagation();
      const person = d.data.husband || d.data.wife;
      if (person) openDetailsModal(person.id);
    });
    
  singleGroup.append('rect')
    .attr('width', nodeWidth - 10)
    .attr('height', nodeHeight - 10)
    .attr('x', -nodeWidth / 2 + 5)
    .attr('y', -nodeHeight / 2 + 5)
    .attr('fill', 'transparent')
    .style('cursor', 'pointer');
    
  singleGroup.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--text-primary)')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text(d => {
      const p = d.data.husband || d.data.wife;
      return p ? p.name : d.data.name;
    });
    
  singleGroup.append('text')
    .attr('x', 0)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--text-secondary)')
    .attr('font-size', '11px')
    .text(d => {
      const p = d.data.husband || d.data.wife;
      return p ? p.surname : '';
    });

  // إضافة زر الطي والفرد الصغير أسفل العقدة
  const toggleGroup = nodeEnter.filter(d => d.children || d._children)
    .append('g')
    .attr('transform', `translate(0, ${nodeHeight / 2})`)
    .on('click', (event, d) => {
      event.stopPropagation();
      toggleNodeChildren(d);
    });
    
  toggleGroup.append('circle')
    .attr('class', 'node-toggle-btn')
    .attr('r', 10);
    
  toggleGroup.append('text')
    .attr('class', 'node-toggle-text')
    .attr('y', -0.5)
    .text(d => d.children ? '−' : '＋');

  // دمج وتحريك العقد المحدثة
  const nodeUpdate = nodeEnter.merge(nodeSelection);
  nodeUpdate.transition()
    .duration(450)
    .attr('transform', d => `translate(${d.x}, ${d.y})`);
    
  nodeUpdate.select('.node-toggle-text')
    .text(d => d.children ? '−' : '＋');
    
  nodeSelection.exit().transition()
    .duration(450)
    .attr('transform', d => `translate(${source.x}, ${source.y})`)
    .remove();
    
  nodes.forEach(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

function toggleNodeChildren(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  const container = document.getElementById('tree-svg-container');
  updateTreeLayout(d, container.clientWidth, container.clientHeight);
}

function diagonalCurve(s, t) {
  const nodeHeight = 85;
  const sy = s.y + nodeHeight / 2;
  const ty = t.y - nodeHeight / 2;
  return `M ${s.x} ${sy} C ${s.x} ${(sy + ty) / 2}, ${t.x} ${(sy + ty) / 2}, ${t.x} ${ty}`;
}

function zoomTree(scaleFactor) {
  if (!treeSvg || !treeZoomBehavior) return;
  treeSvg.transition().duration(350).call(treeZoomBehavior.scaleBy, scaleFactor);
}

function resetTreeZoom() {
  if (!treeSvg || !treeZoomBehavior || !treeRootData) return;
  const container = document.getElementById('tree-svg-container');
  const width = container.clientWidth;
  
  const isMobile = window.innerWidth < 768;
  const scale = isMobile ? 0.55 : 0.85;
  const transform = d3.zoomIdentity.translate(width / 2, 60).scale(scale);
  
  treeSvg.transition().duration(750).call(treeZoomBehavior.transform, transform);
}

function handleTreeSearchInput() {
  const input = document.getElementById('tree-search-input');
  const suggestions = document.getElementById('tree-search-suggestions');
  const query = input.value.trim().toLowerCase();
  
  if (!query) {
    suggestions.classList.add('hidden');
    return;
  }
  
  const matches = FAMILY_DATA.filter(p => {
    if (!p.name) return false;
    return `${p.name} ${p.surname}`.toLowerCase().includes(query);
  }).slice(0, 5);
  
  if (matches.length === 0) {
    suggestions.innerHTML = `<div class="p-3 text-secondary italic">لا توجد نتائج مطابقة</div>`;
    suggestions.classList.remove('hidden');
    return;
  }
  
  suggestions.innerHTML = '';
  matches.forEach(p => {
    const item = document.createElement('div');
    item.className = 'p-3 hover:bg-accent-gold-light hover:text-luxury-gold cursor-pointer transition-colors border-b border-subtle last:border-0';
    item.innerText = `${p.name} ${p.surname}`;
    item.onclick = () => {
      input.value = `${p.name} ${p.surname}`;
      suggestions.classList.add('hidden');
      focusPersonNodeInTree(p.id);
    };
    suggestions.appendChild(item);
  });
  suggestions.classList.remove('hidden');
}

function focusPersonNodeInTree(personId) {
  if (!treeRootData || !treeSvg || !treeZoomBehavior) return;
  let targetNode = null;
  treeRootData.descendants().forEach(d => {
    if (d.data.husband && d.data.husband.id === personId) targetNode = d;
    else if (d.data.wife && d.data.wife.id === personId) targetNode = d;
  });
  
  if (!targetNode) {
    revealAndExpandAncestorBranches(personId);
    return;
  }
  centerZoomOnNode(targetNode);
}

function revealAndExpandAncestorBranches(personId) {
  let nodeToExpand = null;
  
  function checkNode(d) {
    const isHusband = d.data.husband && d.data.husband.id === personId;
    const isWife = d.data.wife && d.data.wife.id === personId;
    if (isHusband || isWife) {
      nodeToExpand = d;
      return true;
    }
    const childrenList = d.children || d._children;
    if (childrenList) {
      for (let i = 0; i < childrenList.length; i++) {
        if (checkNode(childrenList[i])) {
          if (d._children) {
            d.children = d._children;
            d._children = null;
          }
          return true;
        }
      }
    }
    return false;
  }
  
  checkNode(treeRootData);
  
  if (nodeToExpand) {
    const container = document.getElementById('tree-svg-container');
    updateTreeLayout(treeRootData, container.clientWidth, container.clientHeight);
    setTimeout(() => { centerZoomOnNode(nodeToExpand); }, 450);
  } else {
    alert('⚠️ لم يتم العثور على هذا الشخص في هيكل أنساب الشجرة.');
  }
}

function centerZoomOnNode(node) {
  const container = document.getElementById('tree-svg-container');
  const width = container.clientWidth;
  const height = container.clientHeight;
  const scale = 1.15;
  const tx = width / 2 - node.x * scale;
  const ty = height / 2 - node.y * scale;
  
  const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
  treeSvg.transition().duration(1000).call(treeZoomBehavior.transform, transform);
  
  const nodeGroups = treeSvgGroup.selectAll('g.tree-node-group');
  nodeGroups.each(function(d) {
    if (d.id === node.id) {
      const gNode = d3.select(this);
      gNode.selectAll('.node-pulse-circle').remove();
      gNode.append('circle').attr('class', 'node-pulse-circle').attr('r', 12);
      gNode.append('circle').attr('class', 'node-pulse-circle').attr('r', 12).style('animation-delay', '0.6s');
      setTimeout(() => { gNode.selectAll('.node-pulse-circle').remove(); }, 4000);
    }
  });
}
