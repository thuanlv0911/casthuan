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
  Coins,
  HelpCircle,
  Heart,
  Plane,
  Zap,
  Wifi,
  Wrench
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
    case 'nợ':
    case 'no':
      return <Coins size={size} />;
    
    // Custom common categories mapping
    case 'làm đẹp':
    case 'lam dep':
    case 'sức khỏe & sắc đẹp':
    case 'spa':
    case 'mỹ phẩm':
    case 'yêu bản thân':
      return <Heart size={size} />;
      
    case 'du lịch':
    case 'du lich':
    case 'vé máy bay':
    case 'khách sạn':
      return <Plane size={size} />;
      
    case 'điện nước':
    case 'dien nuoc':
    case 'hóa đơn':
    case 'hoa don':
    case 'tiền điện':
    case 'tiền nước':
      return <Zap size={size} />;
      
    case 'internet':
    case 'wifi':
    case 'cáp':
    case 'điện thoại':
      return <Wifi size={size} />;
      
    case 'sửa chữa':
    case 'sua chua':
    case 'bảo dưỡng':
    case 'sửa xe':
      return <Wrench size={size} />;

    default:
      return <HelpCircle size={size} />;
  }
};
