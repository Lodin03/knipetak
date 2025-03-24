import React, { useState } from 'react';
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';
import './AdminCalenderPage.css';

const orders = [
    { id: 1, dueDate: "2025-03-23", description: "Order 1" },
    { id: 2, dueDate: "2025-03-05", description: "Order 2" },
    { id: 3, dueDate: "2025-03-03", description: "Order 3" },
    { id: 4, dueDate: "2025-03-15", description: "Order 4" },
    { id: 5, dueDate: "2025-03-20", description: "Order 5" },
    { id: 6, dueDate: "2025-03-25", description: "Order 6" },
    { id: 7, dueDate: "2025-03-25", description: "Order 7" },
    { id: 8, dueDate: "2025-03-19", description: "Order 8" },
];

const AdminCalenderPage: React.FC = () => {
    const [filter, setFilter] = useState('today');

    const filterOrders = () => {
        const now = new Date();
    
        return orders.filter(order => {
            const dueDate = new Date(order.dueDate);
    
            if (filter === 'today') {
                return dueDate.toDateString() === now.toDateString();
            } else if (filter === 'week') {
                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                weekStart.setHours(0, 0, 0, 0);
    
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
    
                return dueDate >= weekStart && dueDate <= weekEnd;
            } else if (filter === 'month') {
                return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
            }
            return false;
        });
    };

    const filteredOrders = filterOrders();

    return (
        <>
            <NavigationBar />
            <div className="calendar-container">
                <h1 className="calendar-title">Admin Kalender</h1>
                <div className="filter-section">
                    <label htmlFor="filter">Vis bestillinger for:</label>
                    <select 
                        id="filter" 
                        value={filter} 
                        onChange={e => setFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="today">I dag</option>
                        <option value="week">Denne uken</option>
                        <option value="month">Denne måneden</option>
                    </select>
                </div>
                <div className="orders-list">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map(order => (
                            <div key={order.id} className="order-item">
                                <span className="order-description">{order.description}</span>
                                <span className="order-date">{new Date(order.dueDate).toLocaleDateString('nb-NO')}</span>
                            </div>
                        ))
                    ) : (
                        <div className="no-orders">Ingen bestillinger funnet for valgt periode.</div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default AdminCalenderPage;