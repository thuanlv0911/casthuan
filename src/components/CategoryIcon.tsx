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
  Wrench,
  Coffee,
  Shirt,
  Film,
  HeartPulse,
  PiggyBank,
  Smartphone,
  GraduationCap,
  Dumbbell,
  PawPrint,
  ShoppingCart,
  Fuel,
  Trophy
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CategoryIconProps {
  category: string;
  type: 'income' | 'expense' | 'transfer';
  size?: number;
}

export const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
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
  Wrench,
  Coffee,
  Shirt,
  Film,
  HeartPulse,
  PiggyBank,
  Smartphone,
  GraduationCap,
  Dumbbell,
  PawPrint,
  ShoppingCart,
  Fuel,
  Trophy
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, type, size = 18 }) => {
  // Try to use app context to find custom icon
  try {
    const { categories } = useApp();
    const matchedCat = categories.find(
      c => c.name.toLowerCase().trim() === category.toLowerCase().trim() && c.type === (type === 'transfer' ? 'expense' : type)
    );
    if (matchedCat && matchedCat.icon && ICON_MAP[matchedCat.icon]) {
      const IconComponent = ICON_MAP[matchedCat.icon];
      return <IconComponent size={size} />;
    }
  } catch (e) {
    // If context is not available for some reason, fallback
  }

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
