import React, { useState } from 'react';
import NavigationBar from '../../components/NavigationBar/NavigationBar';
import Footer from '../../components/Footer/Footer';

const orders = [
    { id: 1, dueDate: "2023-10-01", description: "Order 1" },
    { id: 2, dueDate: "2023-10-05", description: "Order 2" },
    { id: 3, dueDate: "2023-10-10", description: "Order 3" },
    { id: 4, dueDate: "2023-10-15", description: "Order 4" },
    { id: 5, dueDate: "2023-10-20", description: "Order 5" },
    { id: 6, dueDate: "2023-10-25", description: "Order 6" },
    { id: 7, dueDate: "2023-10-30", description: "Order 7" },
    { id: 8, dueDate: "2025-03-19", description: "Order 8" },
];


const AdminCalenderPage: React.FC = () => {
    const [filter, setFilter] = useState('today');

    const filterOrders = () => {
        const now = new Date();
        console.log("Current Date:", now);
    
        return orders.filter(order => {
            const dueDate = new Date(order.dueDate);
            console.log("Checking Order:", order.description, "Due:", dueDate);
    
            if (filter === 'today') {
                console.log("Comparing with Today:", dueDate.toDateString() === now.toDateString());
                return dueDate.toDateString() === now.toDateString();
            } else if (filter === 'week') {
                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // Start of the week (Sunday)
                weekStart.setHours(0, 0, 0, 0);
    
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6); // End of the week (Saturday)
                weekEnd.setHours(23, 59, 59, 999);
    
                console.log("Week Start:", weekStart, "Week End:", weekEnd);
                console.log("Is order within the week?", dueDate >= weekStart && dueDate <= weekEnd);
    
                return dueDate >= weekStart && dueDate <= weekEnd;
            } else if (filter === 'month') {
                console.log("Comparing with Month:", dueDate.getMonth(), now.getMonth(), dueDate.getFullYear(), now.getFullYear());
                return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
            }
            return false;
        });
    };
    
    

    const filteredOrders = filterOrders();

    return (
        <>
            <NavigationBar />
            <div>
                <h1>Admin Calender Page</h1>
                <label htmlFor="filter">Filter:</label>
                <select id="filter" value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                </select>
                <ul>
    {filteredOrders.length > 0 ? (
        filteredOrders.map(order => (
            <li key={order.id}>
                {order.description} - {order.dueDate.toString()}
            </li>
        ))
    ) : (
        <li>No orders found for the selected filter.</li>
    )}
</ul>

            </div>
            <Footer />
        </>
    );

    };

export default AdminCalenderPage;