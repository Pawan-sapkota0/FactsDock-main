import React from "react";
import { Outlet, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex gap-6">
            <nav className="w-64">
              <ul className="space-y-2">
                <li>
                  <Link to="/admin">Dashboard</Link>
                </li>
                <li>
                  <Link to="/admin/facts">Facts</Link>
                </li>
                <li>
                  <Link to="/admin/quizzes">Quizzes</Link>
                </li>
                <li>
                  <Link to="/admin/categories">Categories</Link>
                </li>
                <li>
                  <Link to="/admin/messages">Messages</Link>
                </li>
              </ul>
            </nav>
            <section className="flex-1">
              <Outlet />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminLayout;
