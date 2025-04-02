"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Info,
  Coffee,
  Utensils,
  Moon,
  Image as ImageIcon,
  Loader2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// --- BƯỚC 1: Import Dialog components ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  // DialogTrigger, // Không cần Trigger nếu mở bằng state
} from "@/components/ui/dialog"
// --- Hết BƯỚC 1 ---
import { imageGenerationService } from "@/lib/image-generation-service"

interface MealPlanProps {
  plan: any
  onRegenerateMeal?: (mealType: string, dayIndex: number, mealIndex: number) => void
  onLikeMeal?: (mealType: string, dayIndex: number, mealIndex: number) => void
  onDislikeMeal?: (mealType: string, dayIndex: number, mealIndex: number, reason?: string) => void
  isPersonalized?: boolean
  personalizationReason?: string
}

export function MealPlan({
  plan,
  onRegenerateMeal,
  onLikeMeal,
  onDislikeMeal,
  isPersonalized,
  personalizationReason,
}: MealPlanProps) {
  const [expandedMeals, setExpandedMeals] = useState<string[]>([])
  const [activeDay, setActiveDay] = useState(0)
  const [generatingImage, setGeneratingImage] = useState<{ [key: string]: boolean }>({})
  const [mealImages, setMealImages] = useState<{ [key: string]: string }>({})

  // --- BƯỚC 2: Thêm State để quản lý ảnh đang xem ---
  const [viewingImage, setViewingImage] = useState<string | null>(null) // Lưu URL ảnh hoặc null
  // --- Hết BƯỚC 2 ---

  const toggleMeal = (mealId: string) => {
    setExpandedMeals((prev) => (prev.includes(mealId) ? prev.filter((id) => id !== mealId) : [...prev, mealId]))
  }

  const handleGenerateImage = async (meal: any, mealId: string) => {
    if (generatingImage[mealId]) return;

    setGeneratingImage(prev => ({ ...prev, [mealId]: true }));

    try {
      if (!imageGenerationService.genAI) {
        throw new Error('Image generation service not initialized');
      }

      const description = `${meal.description || ''} ${meal.ingredients?.join(', ') || ''}`;
      const result = await imageGenerationService.generateMealImage(meal.name, description);

      if (result.success && result.imageUrl) {
        setMealImages(prev => ({ ...prev, [mealId]: result.imageUrl! }));
      } else {
        console.error('Failed to generate image:', result.error);
        // Optionally show error to user via toast/alert
      }
    } catch (error) {
      console.error('Error generating image:', error);
      // Optionally show error to user via toast/alert
    } finally {
      setGeneratingImage(prev => ({ ...prev, [mealId]: false }));
    }
  }

  if (!plan || !plan.days || plan.days.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">Không có thông tin thực đơn</CardContent>
      </Card>
    )
  }

  const isWeeklyPlan = plan.days.length > 1

  return (
    <> {/* Sử dụng Fragment để bao bọc Card và Dialog */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {isWeeklyPlan ? "Thực đơn theo tuần" : "Thực đơn theo ngày"}
            {isPersonalized && (
              <Badge variant="outline" className="ml-2 bg-primary/10">
                Đã điều chỉnh
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isWeeklyPlan
              ? `Thực đơn cân bằng dinh dưỡng cho ${plan.days.length} ngày`
              : "Thực đơn cân bằng dinh dưỡng cho một ngày"}
            {isPersonalized && personalizationReason && (
              <div className="mt-1 text-primary italic">Điều chỉnh theo yêu cầu: "{personalizationReason}"</div>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isWeeklyPlan && (
            <Tabs defaultValue="0" value={activeDay.toString()} className="w-full">
              <div className="px-4 pt-2 border-b">
                <TabsList className="w-full justify-start overflow-x-auto">
                  {plan.days.map((day: any, index: number) => (
                    <TabsTrigger
                      key={index}
                      value={index.toString()}
                      onClick={() => setActiveDay(index)}
                      className="min-w-[80px]"
                    >
                      {day.name || `Ngày ${index + 1}`}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {plan.days.map((day: any, dayIndex: number) => (
                <TabsContent key={dayIndex} value={dayIndex.toString()} className="m-0">
                  <div className="p-4 space-y-4">{renderDayMeals(day, dayIndex)}</div>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {!isWeeklyPlan && <div className="p-4 space-y-4">{renderDayMeals(plan.days[0], 0)}</div>}
        </CardContent>
      </Card>

      {/* --- BƯỚC 4: Render Dialog --- */}
      <Dialog
        open={!!viewingImage} // Mở dialog nếu viewingImage có giá trị (không phải null)
        onOpenChange={(isOpen) => {
          // Khi dialog đóng (bằng nút X, click ngoài, Esc), đặt lại state
          if (!isOpen) {
            setViewingImage(null)
          }
        }}
      >
        <DialogContent className="max-w-3xl w-auto p-2 sm:p-4"> {/* Tùy chỉnh kích thước nếu cần */}
          {/* <DialogHeader>
            <DialogTitle>Xem ảnh</DialogTitle>
          </DialogHeader> */}
          {viewingImage && ( // Chỉ render ảnh nếu có URL
            <img
              src={viewingImage}
              alt="Xem trước ảnh món ăn"
              className="max-w-full max-h-[80vh] object-contain rounded-md mx-auto" // Style để ảnh hiển thị đẹp trong dialog
            />
          )}
        </DialogContent>
      </Dialog>
      {/* --- Hết BƯỚC 4 --- */}
    </>
  )

  function renderDayMeals(day: any, dayIndex: number) {
    // ... (code render bữa sáng, trưa, tối, summary giữ nguyên) ...
    return (
      <>
        {/* Breakfast */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Coffee className="h-4 w-4 text-primary" />
            <span>Bữa sáng</span>
          </div>
          {day.meals.breakfast.map((meal: any, mealIndex: number) => {
            const mealId = `breakfast-${dayIndex}-${mealIndex}`
            return (
              <div key={mealId} className="border rounded-lg overflow-hidden">
                {renderMealCard(meal, mealId)}
              </div>
            )
          })}
        </div>

        {/* Lunch */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Utensils className="h-4 w-4 text-primary" />
            <span>Bữa trưa</span>
          </div>
          {day.meals.lunch.map((meal: any, mealIndex: number) => {
            const mealId = `lunch-${dayIndex}-${mealIndex}`
            return (
              <div key={mealId} className="border rounded-lg overflow-hidden">
                {renderMealCard(meal, mealId)}
              </div>
            )
          })}
        </div>

        {/* Dinner */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Moon className="h-4 w-4 text-primary" />
            <span>Bữa tối</span>
          </div>
          {day.meals.dinner.map((meal: any, mealIndex: number) => {
            const mealId = `dinner-${dayIndex}-${mealIndex}`
            return (
              <div key={mealId} className="border rounded-lg overflow-hidden">
                {renderMealCard(meal, mealId)}
              </div>
            )
          })}
        </div>

        {/* Daily summary */}
        {day.totalNutrition && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Info className="h-4 w-4 text-primary" />
              <span>Tổng dinh dưỡng trong ngày</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-primary/10 p-2 rounded text-center">
                <div className="text-xs font-medium">Calo</div>
                <div className="font-medium">{day.totalNutrition.calories || "-"}</div>
              </div>
              <div className="bg-primary/10 p-2 rounded text-center">
                <div className="text-xs font-medium">Protein</div>
                <div className="font-medium">{day.totalNutrition.protein || "-"}</div>
              </div>
              <div className="bg-primary/10 p-2 rounded text-center">
                <div className="text-xs font-medium">Carbs</div>
                <div className="font-medium">{day.totalNutrition.carbs || "-"}</div>
              </div>
              <div className="bg-primary/10 p-2 rounded text-center">
                <div className="text-xs font-medium">Chất béo</div>
                <div className="font-medium">{day.totalNutrition.fat || "-"}</div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  function renderMealCard(meal: any, mealId: string) {
    return (
      <div className="relative">
        {/* Meal header with controls */}
        <div
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 border-b"
          onClick={() => toggleMeal(mealId)}
        >
          {/* ... (phần header giữ nguyên) ... */}
           <div className="flex items-center gap-2">
            <span className="font-medium">{meal.name}</span>
            {meal.calories && (
              <Badge variant="outline" className="ml-2">
                {meal.calories} kcal
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2">
              {/* Generate Image Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation() // Ngăn không toggle card khi bấm nút này
                        handleGenerateImage(meal, mealId)
                      }}
                      disabled={generatingImage[mealId]}
                    >
                      {generatingImage[mealId] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tạo ảnh minh họa</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Meal Actions */}
              <MealActions
                mealType={mealId.split("-")[0]}
                dayIndex={parseInt(mealId.split("-")[1])}
                mealIndex={parseInt(mealId.split("-")[2])}
                onRegenerate={onRegenerateMeal}
                onLike={onLikeMeal}
                onDislike={onDislikeMeal}
              />
            </div>
            {expandedMeals.includes(mealId) ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>

        {/* Expanded content including image */}
        {expandedMeals.includes(mealId) && (
          <div className="p-3 space-y-4">
            {/* Generated Image */}
            {mealImages[mealId] && (
              // --- BƯỚC 3: Gắn onClick vào ảnh ---
              <div
                className="rounded-md overflow-hidden border cursor-pointer group relative" // Thêm cursor-pointer
                onClick={(e) => {
                  e.stopPropagation() // Ngăn không toggle card khi bấm ảnh
                  setViewingImage(mealImages[mealId]) // Mở dialog với ảnh này
                }}
              >
                <img
                  src={mealImages[mealId]}
                  alt={meal.name}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" // Thêm hiệu ứng hover nhẹ
                  loading="lazy"
                />
                 {/* Optional: Add an overlay or icon on hover to indicate clickability */}
                 <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ImageIcon className="h-8 w-8 text-white" />
                 </div>
              </div>
              // --- Hết BƯỚC 3 ---
            )}

            {/* Meal Details */}
            {/* ... (phần chi tiết món ăn giữ nguyên) ... */}
             {meal.description && <p className="text-sm">{meal.description}</p>}

            {meal.ingredients && meal.ingredients.length > 0 && (
              <div>
                <h4 className="text-xs font-medium mb-1">Nguyên liệu:</h4>
                <ul className="text-xs list-disc pl-5 space-y-1">
                  {meal.ingredients.map((ingredient: string, i: number) => (
                    <li key={i}>{ingredient}</li>
                  ))}
                </ul>
              </div>
            )}

            {meal.preparation && (
              <div className="mb-2">
                <h4 className="text-xs font-medium mb-1">Cách chế biến:</h4>
                <div className="text-xs whitespace-pre-wrap">{meal.preparation}</div>
              </div>
            )}

            {meal.nutrition && (
              <div className="mb-2">
                <h4 className="text-xs font-medium mb-1">Dinh dưỡng:</h4>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-muted/50 p-1 rounded text-center">
                    <div className="text-xs font-medium">Calo</div>
                    <div>{meal.nutrition.calories || "-"}</div>
                  </div>
                  <div className="bg-muted/50 p-1 rounded text-center">
                    <div className="text-xs font-medium">Protein</div>
                    <div>{meal.nutrition.protein || "-"}</div>
                  </div>
                  <div className="bg-muted/50 p-1 rounded text-center">
                    <div className="text-xs font-medium">Carbs</div>
                    <div>{meal.nutrition.carbs || "-"}</div>
                  </div>
                  <div className="bg-muted/50 p-1 rounded text-center">
                    <div className="text-xs font-medium">Chất béo</div>
                    <div>{meal.nutrition.fat || "-"}</div>
                  </div>
                </div>
              </div>
            )}

            {meal.source && (
              <div className="mt-2 pt-2 border-t">
                <h4 className="text-xs font-medium mb-1">Nguồn:</h4>
                <a
                  href={meal.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <span>{meal.sourceName || meal.source}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-external-link"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}

// Component MealActions giữ nguyên
function MealActions({
  mealType,
  dayIndex,
  mealIndex,
  onRegenerate,
  onLike,
  onDislike,
}: {
  mealType: string
  dayIndex: number
  mealIndex: number
  onRegenerate?: (mealType: string, dayIndex: number, mealIndex: number) => void
  onLike?: (mealType: string, dayIndex: number, mealIndex: number) => void
  onDislike?: (mealType: string, dayIndex: number, mealIndex: number, reason?: string) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onLike?.(mealType, dayIndex, mealIndex)
              }}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tôi thích món này</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tôi không thích món này</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onDislike?.(mealType, dayIndex, mealIndex)}>
            Không thích, đổi món khác
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDislike?.(mealType, dayIndex, mealIndex, "calories")}>
            Quá nhiều calories
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDislike?.(mealType, dayIndex, mealIndex, "protein")}>
            Cần nhiều protein hơn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDislike?.(mealType, dayIndex, mealIndex, "vegetarian")}>
            Muốn món chay thay thế
          </DropdownMenuItem>
           <DropdownMenuItem onClick={() => onDislike?.(mealType, dayIndex, mealIndex, "spicy")}>
            Quá cay
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onRegenerate?.(mealType, dayIndex, mealIndex)
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tạo lại món khác</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}