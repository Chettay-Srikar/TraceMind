 
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ServiceNode } from '../types';
import { Layers, Activity, Search,  AlertTriangle,  } from 'lucide-react';
import { StatusIndicator } from '../components/common/StatusIndicator';

export const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const data = await api.getServices();
      setServices(data);
      setLoading(false);
    };
    fetchServices();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-500" />
            Service Health Catalog
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Monitor microservices availability and performance</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        
        {/* Service Topology Mockup */}
        <div className="mb-10 pb-10 border-b border-slate-800 relative hidden lg:block">
          <h2 className="text-lg font-semibold text-white mb-6">Service Topology</h2>
          <div className="flex flex-col items-center gap-8 relative z-10 font-mono text-sm">
            
            <div className="bg-slate-800 border border-slate-700 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 w-64 justify-center">
              API Gateway <StatusIndicator status="healthy" />
            </div>
            
            <div className="flex gap-40 relative">
              <div className="absolute top-[-32px] left-[50%] h-8 w-px bg-slate-700"></div>
              <div className="absolute top-[-16px] left-[15%] right-[15%] h-px bg-slate-700"></div>
              <div className="absolute top-[-16px] left-[15%] h-4 w-px bg-slate-700"></div>
              <div className="absolute top-[-16px] right-[15%] h-4 w-px bg-slate-700"></div>
              
              <div className="bg-red-900/40 border-2 border-red-500 px-6 py-3 rounded-lg shadow-lg text-white flex flex-col items-center gap-1 w-56 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">Payment Service</span> 
                  <StatusIndicator status="critical" pulse />
                </div>
                <div className="text-xs text-red-400">Error: 41.8%</div>
                <div className="text-xs text-red-400">Latency: 4.7s</div>
              </div>
              
              <div className="bg-orange-900/40 border border-orange-500/50 px-6 py-3 rounded-lg shadow-lg text-white flex flex-col items-center gap-1 w-56">
                <div className="flex items-center gap-2 mb-1">
                  <span>Order Service</span>
                  <StatusIndicator status="warning" />
                </div>
                <div className="text-xs text-orange-400">Error: 2.1%</div>
              </div>

              <div className="bg-slate-800 border border-slate-700 px-6 py-3 rounded-lg shadow-lg text-white flex flex-col items-center gap-1 w-56">
                <div className="flex items-center gap-2 mb-1">
                  <span>User Service</span>
                  <StatusIndicator status="healthy" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-32 relative">
               <div className="absolute top-[-32px] left-[20%] h-8 w-px bg-slate-700"></div>
               <div className="absolute top-[-32px] right-[20%] h-8 w-px bg-slate-700"></div>
               
               <div className="bg-red-900/20 border-2 border-red-500 border-dashed px-6 py-3 rounded-lg shadow-lg text-white flex flex-col items-center gap-1 w-48 relative z-10">
                 <div className="flex items-center gap-2 mb-1">
                   <span>PostgreSQL DB</span>
                   <StatusIndicator status="critical" />
                 </div>
               </div>
               
               <div className="bg-slate-800 border border-slate-700 px-6 py-3 rounded-lg shadow-lg text-white flex flex-col items-center gap-1 w-48 relative z-10">
                 <div className="flex items-center gap-2 mb-1">
                   <span>Redis Cache</span>
                   <StatusIndicator status="healthy" />
                 </div>
               </div>
            </div>
            
          </div>
          
          {/* Animated data flow lines */}
          <div className="absolute top-[80px] left-[35%] w-2 h-2 rounded-full bg-indigo-500 animate-[ping_2s_infinite]"></div>
          <div className="absolute top-[80px] right-[35%] w-2 h-2 rounded-full bg-indigo-500 animate-[ping_3s_infinite]"></div>
        </div>

        {/* List of Services */}
        <div>
          <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Service List</h2>
            <div className="relative flex-1 min-w-[250px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search services..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500">Loading services...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {services.map(service => {
                const isCritical = service.status === 'critical';
                const isWarning = service.status === 'warning';
                
                return (
                  <div key={service.id} className={`bg-slate-950 border rounded-lg p-5 group transition-all cursor-pointer ${
                    isCritical ? 'border-red-500/50 hover:border-red-500' :
                    isWarning ? 'border-orange-500/50 hover:border-orange-500' :
                    'border-slate-800 hover:border-slate-700'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${
                          isCritical ? 'bg-red-500/10 text-red-500' :
                          isWarning ? 'bg-orange-500/10 text-orange-500' :
                          'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium group-hover:text-indigo-400 transition-colors">{service.name}</h3>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{service.id}</div>
                        </div>
                      </div>
                      <StatusIndicator status={service.status} pulse={isCritical} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Error Rate</div>
                        <div className={`text-sm font-medium ${isCritical ? 'text-red-400' : 'text-slate-300'}`}>{service.errorRate}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> P95 Latency</div>
                        <div className="text-sm font-medium text-slate-300">{service.latency}ms</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Availability</div>
                        <div className="text-sm text-slate-300">{service.availability}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Last Deploy</div>
                        <div className="text-sm text-slate-300">{service.lastDeployment}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
