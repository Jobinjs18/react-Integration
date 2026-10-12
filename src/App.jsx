import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Boxes, Check, ChevronDown,
  CircleAlert, LayoutDashboard, Menu, Package, Plus, RefreshCw, Search,
  ShoppingBag, X
} from "lucide-react";

const API_BASE = "https://nodejs-postgresql-o9c8.onrender.com/api";
const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2
}).format(Number(value || 0));

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", description: "", price: "", quantity: "1" });
  const [saving, setSaving] = useState(false);

  async function loadProducts(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/get-product`);
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const result = await response.json();
      if (result.status === false) throw new Error(result.message || "Could not load products");
      const list = Array.isArray(result) ? result : (result.data || result.products || []);
      setProducts(list);
    } catch (err) {
      setError(`${err.message}. Check the API URL and CORS settings, then try again.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => products.filter((p) =>
    `${p.name || ""} ${p.description || ""} ${p.id || ""}`.toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  const totalValue = products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0), 0);
  const totalUnits = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const lowStock = products.filter((p) => Number(p.quantity || 0) <= 5).length;

  function updateField(e) {
    setForm((old) => ({ ...old, [e.target.name]: e.target.value }));
  }

  async function createProduct(e) {
    e.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch(`${API_BASE}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          quantity: Number(form.quantity)
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.status === false) {
        throw new Error(result.message || `Could not create product (${response.status})`);
      }
      setNotice("Product added successfully.");
      setForm({ name: "", description: "", price: "", quantity: "1" });
      setShowForm(false);
      await loadProducts(true);
    } catch (err) {
      setError(`${err.message}. If the API is reachable but this persists, check server CORS and request format.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Boxes size={22}/></span><span>stockwise<span className="brand-dot">.</span></span><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={20}/></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          <a className="nav-link active" href="#dashboard" onClick={() => setMobileNav(false)}><LayoutDashboard size={18}/> Dashboard</a>
          <a className="nav-link" href="#products" onClick={() => setMobileNav(false)}><Package size={18}/> Products <span className="nav-count">{products.length}</span></a>
          <a className="nav-link" href="#inventory" onClick={() => setMobileNav(false)}><ShoppingBag size={18}/> Inventory</a>
        </nav>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Activity size={17}/></div><strong>Inventory insights</strong><p>Keep your product data organized and up to date.</p><a href="#products">View products <span>↗</span></a></div><div className="profile"><div className="avatar">SW</div><div className="profile-info"><strong>Store workspace</strong><span>Product admin</span></div><ChevronDown size={16}/></div></div>
      </aside>
      {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
      <main className="main-area" id="dashboard">
        <header className="topbar"><div className="topbar-left"><button className="icon-button menu-toggle" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21}/></button><div><span className="eyebrow">WORKSPACE / OVERVIEW</span><h1>Product dashboard</h1></div></div><div className="top-actions"><span className="status-pill"><span className="status-dot"/> API connected</span><button className="avatar top-avatar" aria-label="Profile">SW</button></div></header>
        <section className="page-content">
          <div className="welcome-row"><div><p className="muted intro">Here’s what’s happening with your inventory today.</p><div className="date-line"><span className="date-dot"/> Live product data <span className="date-divider">·</span> PostgreSQL API</div></div><div className="welcome-actions"><button className="button button-secondary" onClick={() => loadProducts(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "spin" : ""}/> Refresh</button><button className="button button-primary" onClick={() => {setShowForm(true); setNotice("");}}><Plus size={17}/> Add product</button></div></div>
          {notice && <div className="notice success"><Check size={17}/>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}
          {error && <div className="notice error"><CircleAlert size={18}/><span>{error}</span><button onClick={() => loadProducts(true)} aria-label="Retry">Retry</button></div>}
          <div className="stats-grid">
            <StatCard icon={<Package size={19}/>} label="Total products" value={loading ? "—" : products.length.toLocaleString("en-IN")} note="Products in your catalog" tone="violet" trend="Catalog"/>
            <StatCard icon={<Boxes size={19}/>} label="Units in stock" value={loading ? "—" : totalUnits.toLocaleString("en-IN")} note="Combined available quantity" tone="blue" trend="Quantity"/>
            <StatCard icon={<Activity size={19}/>} label="Inventory value" value={loading ? "—" : money(totalValue)} note="Price × quantity" tone="green" trend="Estimated"/>
            <StatCard icon={<CircleAlert size={19}/>} label="Low stock items" value={loading ? "—" : lowStock.toLocaleString("en-IN")} note="5 units or fewer" tone="orange" trend={lowStock ? "Review" : "All good"} warning={lowStock > 0}/>
          </div>
          <section className="panel" id="products">
            <div className="panel-heading"><div><div className="heading-title"><h2>Product inventory</h2><span className="count-badge">{products.length}</span></div><p>Manage and track the products in your catalog.</p></div><button className="button button-primary compact-add" onClick={() => setShowForm(true)}><Plus size={16}/> Add product</button></div>
            <div className="table-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." aria-label="Search products"/>{search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={15}/></button>}</div><span className="results-label">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span></div>
            {loading ? <div className="loading-state"><span className="loader"/><p>Loading your products...</p></div> : products.length === 0 && !error ? <div className="empty-state"><div className="empty-icon"><Package size={25}/></div><h3>Your inventory is empty</h3><p>Add your first product to get started.</p><button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={16}/> Add first product</button></div> : filtered.length === 0 ? <div className="empty-state"><Search size={25}/><h3>No matching products</h3><p>Try a different product name or description.</p></div> : <><div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>PRICE</th><th>QUANTITY</th><th>STOCK STATUS</th><th>CREATED</th></tr></thead><tbody>{filtered.map((p) => <tr key={p.id}><td><div className="product-cell"><div className={`product-icon product-color-${Number(p.id || 0) % 4}`}><Package size={18}/></div><div className="product-details"><strong>{p.name || "Unnamed product"}</strong><span>{p.description || "No description"} <span className="product-id">· #{p.id}</span></span></div></div></td><td className="price-cell">{money(p.price)}</td><td><span className="quantity">{p.quantity ?? 0}</span></td><td><span className={`stock-badge ${Number(p.quantity || 0) <= 5 ? "stock-low" : "stock-good"}`}><span/>{Number(p.quantity || 0) <= 5 ? "Low stock" : "In stock"}</span></td><td className="date-cell">{p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td></tr>)}</tbody></table></div><div className="mobile-products">{filtered.map((p) => <article className="mobile-product-card" key={p.id}><div className="mobile-product-top"><div className={`product-icon product-color-${Number(p.id || 0) % 4}`}><Package size={18}/></div><div className="product-details"><strong>{p.name || "Unnamed product"}</strong><span>{p.description || "No description"} · #{p.id}</span></div><strong className="mobile-price">{money(p.price)}</strong></div><div className="mobile-product-bottom"><span>Qty: <b>{p.quantity ?? 0}</b></span><span className={`stock-badge ${Number(p.quantity || 0) <= 5 ? "stock-low" : "stock-good"}`}><span/>{Number(p.quantity || 0) <= 5 ? "Low stock" : "In stock"}</span><span>{p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}</span></div></article>)}</div><div className="table-footer"><span>Showing <b>{filtered.length}</b> of <b>{products.length}</b> products</span><span className="footer-live"><span className="status-dot"/> Synced from API</span></div></>}
          </section>
          <footer className="footer"><span>© 2026 Stockwise Dashboard</span><span>Built for simple, smarter inventory management</span></footer>
        </section>
      </main>
      {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => {if (e.target === e.currentTarget) setShowForm(false);}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><div className="modal-kicker">PRODUCT CATALOG</div><h2 id="modal-title">Add new product</h2><p>Enter the details below to add an item to your inventory.</p></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close dialog"><X size={20}/></button></div><form onSubmit={createProduct}><label>Product name<input name="name" value={form.name} onChange={updateField} placeholder="e.g. HP Laptop" required maxLength={120}/></label><label>Description<textarea name="description" value={form.description} onChange={updateField} placeholder="Short product description" rows="3" required maxLength={500}/></label><div className="form-grid"><label>Price (₹)<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} placeholder="45000.00" required/></label><label>Quantity<input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={updateField} required/></label></div><div className="form-note"><CircleAlert size={16}/> Product details will be sent to your connected API.</div><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? <><span className="button-loader"/> Saving...</> : <><Plus size={16}/> Create product</>}</button></div></form></section></div>}
    </div>
  );
}

function StatCard({ icon, label, value, note, tone, trend, warning }) {
  return <article className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}>{icon}</span><span className={`stat-tag ${warning ? "tag-warning" : ""}`}>{warning ? <ArrowDownRight size={13}/> : <ArrowUpRight size={13}/>} {trend}</span></div><p className="stat-label">{label}</p><div className="stat-value">{value}</div><p className="stat-note">{note}</p></article>;
}

export default App;