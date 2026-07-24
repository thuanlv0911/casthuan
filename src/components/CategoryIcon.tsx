import React from 'react';
import { 
  Utensils, 
  ShoppingBag, 
  Home, 
  Car, 
  Activity, 
  Gamepad2, 
  BookOpen, 
  ArrowLeftRight, 
  Briefcase, 
  Laptop, 
  Gift, 
  TrendingUp, 
  HelpCircle 
} from 'lucide-react';

interface CategoryIconProps {
  category: string;
  type: 'income' | 'expense' | 'transfer';
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, type, size = 18 }) => {
  const cleanCat = category.toLowerCase().trim();

  if (type === 'transfer' || cleanCat === 'chuyển khoản') {
    return <ArrowLeftRight size={size} />;
  }

  switch (cleanCat) {
    // Expense
    case 'ăn uống':
    case 'an uong':
      return <Utensils size={size} />;
    case 'mua sắm':
    case 'mua sam':
      return <ShoppingBag size={size} />;
    case 'tiền nhà':
    case 'tien nha':
      return <Home size={size} />;
    case 'xăng xe':
    case 'xang xe':
    case 'di chuyển':
      return <Car size={size} />;
    case 'sức khỏe':
    case 'suc khoe':
      return <Activity size={size} />;
    case 'giải trí':
    case 'giai tri':
      return <Gamepad2 size={size} />;
    case 'học tập':
    case 'hoc tap':
      return <BookOpen size={size} />;
      
    // Income
    case 'lương':
    case 'luong':
      return <Briefcase size={size} />;
    case 'freelance':
    case 'dự án':
    case 'du an':
      return <Laptop size={size} />;
    case 'được tặng':
    case 'duoc tang':
    case 'tặng':
      return <Gift size={size} />;
    case 'đầu tư':
    case 'dau tu':
      return <TrendingUp size={size} />;

    default:
      return <HelpCircle size={size} />;
  }
};
