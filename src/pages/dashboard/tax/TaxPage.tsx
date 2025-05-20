// src/pages/dashboard/tax/TaxPage.tsx

import { useState } from 'react';
import SideNav from '@/components/dashboard/layout/sideNav';
import { Button } from '@/components/ui/button';
import HelbManagementSection from '@/components/dashboard/tax/HelbManagementSection';

type TaxTab = 'overview' | 'tax' | 'deductions' | 'bonuses' | 'helb';

const TaxPage = () => {
    const [currentTaxTab, setCurrentTaxTab] = useState<TaxTab>('overview');

    const CardContainer = ({ children }: { children: React.ReactNode }) => (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
            {children}
        </div>
    );

    const renderTabContent = () => {
        switch (currentTaxTab) {
            case 'overview':
                return (
                    <CardContainer>
                        <h2 className="text-2xl font-semibold mb-4">Tax Overview</h2>
                        <p className="text-gray-600">This section will provide an overview of tax-related information.</p>
                    </CardContainer>
                );
            case 'tax':
                return (
                    <CardContainer>
                        <h2 className="text-2xl font-semibold mb-4">Tax Calculations</h2>
                        <p className="text-gray-600">This section will deal with PAYE and other tax calculations.</p>
                    </CardContainer>
                );
            case 'deductions':
                return (
                    <CardContainer>
                        <h2 className="text-2xl font-semibold mb-4">Deductions Management</h2>
                        <p className="text-gray-600">Manage various employee deductions here (e.g., NSSF, NHIF, custom deductions).</p>
                    </CardContainer>
                );
            case 'bonuses':
                return (
                    <CardContainer>
                        <h2 className="text-2xl font-semibold mb-4">Bonuses and Allowances</h2>
                        <p className="text-gray-600">Manage employee bonuses and allowances here.</p>
                    </CardContainer>
                );
            case 'helb':
                return (
                    <CardContainer>
                        <HelbManagementSection />
                    </CardContainer>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <SideNav />
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Tax & Bonuses</h1>

                {/* Mini-Sidenav for Tax Sections */}
                <div className="flex space-x-4 border-b pb-2 mb-6">
                    <Button variant={currentTaxTab === 'overview' ? 'secondary' : 'ghost'} onClick={() => setCurrentTaxTab('overview')}>Overview</Button>
                    <Button variant={currentTaxTab === 'tax' ? 'secondary' : 'ghost'} onClick={() => setCurrentTaxTab('tax')}>Tax</Button>
                    <Button variant={currentTaxTab === 'deductions' ? 'secondary' : 'ghost'} onClick={() => setCurrentTaxTab('deductions')}>Deductions</Button>
                    <Button variant={currentTaxTab === 'bonuses' ? 'secondary' : 'ghost'} onClick={() => setCurrentTaxTab('bonuses')}>Bonuses</Button>
                    <Button variant={currentTaxTab === 'helb' ? 'secondary' : 'ghost'} onClick={() => setCurrentTaxTab('helb')}>HELB</Button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default TaxPage;
