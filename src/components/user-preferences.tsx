"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"

interface UserPreferencesProps {
  onPreferencesChange: (preferences: any) => void
}

interface Preferences {
  age: number;
  gender: string;
  weight: number;
  height: number;
  activityLevel: string;
  healthGoals: string[];
  weightGoal: string;
  targetWeight: number;
  weeklyGoal: number;
  calorieGoal: number;
  macroPreferences: {
    protein: number;
    carbs: number;
    fat: number;
    proteinGoal: number;
    carbGoal: number;
    fatGoal: number;
    fiberGoal: number;
  };
  dietaryType: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isPescatarian: boolean;
  isKeto: boolean;
  isLowCarb: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  mealsPerDay: number;
  mealTiming: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  intermittentFasting: boolean;
  fastingWindow: string;
  allergies: string[];
  intolerances: string[];
  avoidIngredients: string[];
  medicalConditions: string[];
  religiousRestrictions: string;
  preferredCuisines: string[];
  spiceLevel: string;
  tastePreferences: {
    sweet: number;
    salty: number;
    sour: number;
    bitter: number;
    umami: number;
  };
  dislikedFoods: string[];
  dislikedIngredients: string[];
  favoriteProteinSources: string[];
  cookingSkill: string;
  cookingTime: {
    weekday: number;
    weekend: number;
  };
  mealPrepPreference: string;
  groceryBudget: {
    amount: number;
    period: string;
  };
  servingSize: string;
  leftoverPreference: boolean;
  unitSystem: string;
  languagePreference: string;
  nutritionDisplay: string;
  sustainabilityPreference: string;
  organicPreference: string;
  localFoodPreference: boolean;
  seasonalPreference: boolean;
}

export function UserPreferences({ onPreferencesChange }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    // Personal Info
    age: 30,
    gender: "other",
    weight: 60,
    height: 165,
    activityLevel: "moderate",
    
    // Health Goals
    healthGoals: ["maintain", "health"],
    weightGoal: "maintain",
    targetWeight: 60,
    weeklyGoal: 0.5, // kg/week
    calorieGoal: 2000,
    
    // Macro Goals
    macroPreferences: {
      protein: 30, // percentage
      carbs: 40,
      fat: 30,
      proteinGoal: 100, // grams
      carbGoal: 250,
      fatGoal: 70,
      fiberGoal: 25,
    },
    
    // Dietary Preferences
    dietaryType: "none",
    isVegetarian: false,
    isVegan: false,
    isPescatarian: false,
    isKeto: false,
    isLowCarb: false,
    isGlutenFree: false,
    isDairyFree: false,

    // Meal Timing
    mealsPerDay: 3,
    mealTiming: {
      breakfast: "07:00",
      lunch: "12:00",
      dinner: "19:00",
      snacks: ["10:00", "15:00"],
    },
    intermittentFasting: false,
    fastingWindow: "16:8",
    
    // Allergies & Restrictions
    allergies: [],
    intolerances: [],
    avoidIngredients: [],
    medicalConditions: [],
    religiousRestrictions: "none",
    
    // Food Preferences
    preferredCuisines: ["vietnamese", "asian"],
    spiceLevel: "medium",
    tastePreferences: {
      sweet: 3,
      salty: 3,
      sour: 3,
      bitter: 2,
      umami: 4,
    },
    dislikedFoods: [],
    dislikedIngredients: [],
    favoriteProteinSources: [],
    
    // Cooking & Shopping
    cookingSkill: "intermediate",
    cookingTime: {
      weekday: 30,
      weekend: 60,
    },
    mealPrepPreference: "fresh",
    groceryBudget: {
      amount: 2000000,
      period: "monthly",
    },
    servingSize: "medium",
    leftoverPreference: true,
    
    // Units & Display
    unitSystem: "metric",
    languagePreference: "vi",
    nutritionDisplay: "detailed",
    
    // Other Preferences
    sustainabilityPreference: "moderate",
    organicPreference: "when-possible",
    localFoodPreference: true,
    seasonalPreference: true,
  })

  const handleChange = (field: string, value: any) => {
    const updatedPreferences = { ...preferences, [field]: value }
    setPreferences(updatedPreferences)
    onPreferencesChange(updatedPreferences)
  }

  const handleSave = () => {
    onPreferencesChange(preferences)
    localStorage.setItem("userPreferences", JSON.stringify(preferences))
  }

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tùy chỉnh cá nhân</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tùy chỉnh cá nhân</DialogTitle>
          <DialogDescription>
            Thiết lập chi tiết để nhận được thực đơn phù hợp nhất với nhu cầu của bạn.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-4 gap-4">
            <TabsTrigger value="personal">Cá nhân</TabsTrigger>
            <TabsTrigger value="dietary">Chế độ ăn</TabsTrigger>
            <TabsTrigger value="health">Sức khỏe</TabsTrigger>
            <TabsTrigger value="preferences">Sở thích</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="age" className="text-right">Tuổi</Label>
                <Input
                  id="age"
                  type="number"
                  value={preferences.age}
                  onChange={(e) => handleChange("age", Number(e.target.value))}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">Giới tính</Label>
                <Select value={preferences.gender} onValueChange={(value) => handleChange("gender", value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="weight" className="text-right">Cân nặng (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={preferences.weight}
                  onChange={(e) => handleChange("weight", Number(e.target.value))}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="height" className="text-right">Chiều cao (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={preferences.height}
                  onChange={(e) => handleChange("height", Number(e.target.value))}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="activityLevel" className="text-right">Mức độ vận động</Label>
                <Select value={preferences.activityLevel} onValueChange={(value) => handleChange("activityLevel", value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Chọn mức độ vận động" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Ít vận động (Công việc văn phòng)</SelectItem>
                    <SelectItem value="light">Nhẹ (Đi bộ, việc nhà nhẹ)</SelectItem>
                    <SelectItem value="moderate">Vừa phải (Tập thể dục 3-5 ngày/tuần)</SelectItem>
                    <SelectItem value="active">Năng động (Tập nặng 6-7 ngày/tuần)</SelectItem>
                    <SelectItem value="very-active">Rất năng động (Vận động viên)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dietary" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dietaryType" className="text-right">Chế độ ăn chính</Label>
                <Select value={preferences.dietaryType} onValueChange={(value) => handleChange("dietaryType", value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Chọn chế độ ăn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không giới hạn</SelectItem>
                    <SelectItem value="vegetarian">Ăn chay</SelectItem>
                    <SelectItem value="vegan">Ăn thuần chay</SelectItem>
                    <SelectItem value="pescatarian">Ăn chay và hải sản</SelectItem>
                    <SelectItem value="keto">Keto</SelectItem>
                    <SelectItem value="low-carb">Ít carb</SelectItem>
                    <SelectItem value="mediterranean">Địa Trung Hải</SelectItem>
                    <SelectItem value="paleo">Paleo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label>Không gluten</Label>
                  <Switch
                    checked={preferences.isGlutenFree}
                    onCheckedChange={(checked) => handleChange("isGlutenFree", checked)}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label>Không lactose</Label>
                  <Switch
                    checked={preferences.isDairyFree}
                    onCheckedChange={(checked) => handleChange("isDairyFree", checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mức độ cay</Label>
                <Select value={preferences.spiceLevel} onValueChange={(value) => handleChange("spiceLevel", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mức độ cay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không cay</SelectItem>
                    <SelectItem value="mild">Hơi cay</SelectItem>
                    <SelectItem value="medium">Cay vừa</SelectItem>
                    <SelectItem value="hot">Cay</SelectItem>
                    <SelectItem value="very-hot">Rất cay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dị ứng & Không dung nạp</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Đậu phộng", "Hải sản", "Sữa", "Trứng", "Đậu nành", "Hạt", "Cá"].map((allergy) => (
                    <div key={allergy} className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.allergies.includes(allergy)}
                        onCheckedChange={(checked) => {
                          const newAllergies = checked 
                            ? [...preferences.allergies, allergy]
                            : preferences.allergies.filter((a) => a !== allergy);
                          handleChange("allergies", newAllergies);
                        }}
                      />
                      <Label>{allergy}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Mục tiêu sức khỏe</Label>
                <Select value={preferences.weightGoal} onValueChange={(value) => handleChange("weightGoal", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mục tiêu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose">Giảm cân</SelectItem>
                    <SelectItem value="maintain">Giữ cân</SelectItem>
                    <SelectItem value="gain">Tăng cân</SelectItem>
                    <SelectItem value="muscle">Tăng cơ</SelectItem>
                    <SelectItem value="health">Cải thiện sức khỏe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mục tiêu dinh dưỡng</Label>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label>Protein ({preferences.macroPreferences.protein}%)</Label>
                      <span className="text-sm text-muted-foreground">
                        {preferences.macroPreferences.proteinGoal}g
                      </span>
                    </div>
                    <Slider
                      value={[preferences.macroPreferences.protein]}
                      max={60}
                      step={5}
                      onValueChange={([value]) => {
                        const newMacros = {
                          ...preferences.macroPreferences,
                          protein: value,
                          proteinGoal: Math.round((preferences.calorieGoal * (value / 100)) / 4)
                        }
                        handleChange("macroPreferences", newMacros)
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label>Carbs ({preferences.macroPreferences.carbs}%)</Label>
                      <span className="text-sm text-muted-foreground">
                        {preferences.macroPreferences.carbGoal}g
                      </span>
                    </div>
                    <Slider
                      value={[preferences.macroPreferences.carbs]}
                      max={70}
                      step={5}
                      onValueChange={([value]) => {
                        const newMacros = {
                          ...preferences.macroPreferences,
                          carbs: value,
                          carbGoal: Math.round((preferences.calorieGoal * (value / 100)) / 4)
                        }
                        handleChange("macroPreferences", newMacros)
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Label>Chất béo ({preferences.macroPreferences.fat}%)</Label>
                      <span className="text-sm text-muted-foreground">
                        {preferences.macroPreferences.fatGoal}g
                      </span>
                    </div>
                    <Slider
                      value={[preferences.macroPreferences.fat]}
                      max={50}
                      step={5}
                      onValueChange={([value]) => {
                        const newMacros = {
                          ...preferences.macroPreferences,
                          fat: value,
                          fatGoal: Math.round((preferences.calorieGoal * (value / 100)) / 9)
                        }
                        handleChange("macroPreferences", newMacros)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Thời gian bữa ăn</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="breakfast">Bữa sáng</Label>
                    <Input
                      id="breakfast"
                      type="time"
                      value={preferences.mealTiming.breakfast}
                      onChange={(e) => {
                        const newTiming = { ...preferences.mealTiming, breakfast: e.target.value }
                        handleChange("mealTiming", newTiming)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lunch">Bữa trưa</Label>
                    <Input
                      id="lunch"
                      type="time"
                      value={preferences.mealTiming.lunch}
                      onChange={(e) => {
                        const newTiming = { ...preferences.mealTiming, lunch: e.target.value }
                        handleChange("mealTiming", newTiming)
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thời gian nấu ăn</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weekdayCooking">Ngày thường (phút)</Label>
                    <Input
                      id="weekdayCooking"
                      type="number"
                      value={preferences.cookingTime.weekday}
                      onChange={(e) => {
                        const newTime = { ...preferences.cookingTime, weekday: Number(e.target.value) }
                        handleChange("cookingTime", newTime)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weekendCooking">Cuối tuần (phút)</Label>
                    <Input
                      id="weekendCooking"
                      type="number"
                      value={preferences.cookingTime.weekend}
                      onChange={(e) => {
                        const newTime = { ...preferences.cookingTime, weekend: Number(e.target.value) }
                        handleChange("cookingTime", newTime)
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ngân sách (VNĐ)</Label>
                <div className="grid grid-cols-4 gap-4">
                  <Input
                    className="col-span-3"
                    type="number"
                    value={preferences.groceryBudget.amount}
                    onChange={(e) => {
                      const newBudget = { ...preferences.groceryBudget, amount: Number(e.target.value) }
                      handleChange("groceryBudget", newBudget)
                    }}
                  />
                  <Select
                    value={preferences.groceryBudget.period}
                    onValueChange={(value) => {
                      const newBudget = { ...preferences.groceryBudget, period: value }
                      handleChange("groceryBudget", newBudget)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Ngày</SelectItem>
                      <SelectItem value="weekly">Tuần</SelectItem>
                      <SelectItem value="monthly">Tháng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Khác</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between space-x-2">
                    <Label>Ưu tiên thực phẩm địa phương</Label>
                    <Switch
                      checked={preferences.localFoodPreference}
                      onCheckedChange={(checked) => handleChange("localFoodPreference", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label>Ưu tiên thực phẩm theo mùa</Label>
                    <Switch
                      checked={preferences.seasonalPreference}
                      onCheckedChange={(checked) => handleChange("seasonalPreference", checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={handleSave}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

