import Sidebar from './Sidebar'

export default function MobileSidebar({ isOpen, onClose }) {
  if (!isOpen) return null
  return <div className="mobile-sidebar"><button type="button" onClick={onClose}>Close</button><Sidebar onNavigate={onClose} /></div>
}
