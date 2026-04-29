'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export function FlashSaleTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [hasActiveSale, setHasActiveSale] = useState(false);

  useEffect(() => {
    // In production, fetch the actual flash sale end time from API
    const saleEndTime = new Date();
    saleEndTime.setHours(saleEndTime.getHours() + 6);

    const calculateTimeLeft = () => {
      const difference = saleEndTime.getTime() - new Date().getTime();

      if (difference <= 0) {
        setHasActiveSale(false);
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      setHasActiveSale(true);
      return {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!hasActiveSale) return null;

  return (
    <section className="container py-8">
      <Card className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0">
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 py-8">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/20 p-4">
              <Clock className="h-8 w-8" />
            </div>
            <div>
              <Badge className="bg-white text-red-600 hover:bg-white/90">Flash Sale</Badge>
              <h3 className="text-2xl font-bold mt-2">Ends Soon!</h3>
              <p className="text-white/80">Grab your favorites before time runs out</p>
            </div>
          </div>
          <div className="flex gap-4">
            {[
              { value: timeLeft.hours, label: 'Hours' },
              { value: timeLeft.minutes, label: 'Minutes' },
              { value: timeLeft.seconds, label: 'Seconds' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="bg-white/20 backdrop-blur rounded-lg p-4 min-w-[70px]">
                  <span className="text-3xl font-bold">
                    {String(item.value).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-sm mt-2 text-white/80">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
