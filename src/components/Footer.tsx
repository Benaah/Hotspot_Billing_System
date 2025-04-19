import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 text-center py-4 mt-8 shadow-inner">
      <div className="text-sm text-gray-600">
        &copy; {new Date().getFullYear()} BenNet Billing System. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
