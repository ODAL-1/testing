import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"

interface Product {
  id: string
  name: string
  category: string
  price: number
  unitsSold: number
  revenue: number
}

interface ClickMetric {
  id: string
  productName: string
  clicks: number
  conversionRate: number
  lastClicked: Date
}

interface PeriodComparison {
  current: number
  previous: number
  percentChange: number
}

@Component({
  selector: "app-statistics",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./statistics.component.html",
  styleUrl: "./statistics.component.scss",
})
export class StatisticsComponent implements OnInit {
  timeRange: "day" | "week" | "month" | "year" = "month"
  showFilterMenu = false
  categoryFilter = "all"

  products: Product[] = []
  clickMetrics: ClickMetric[] = []

  filteredProducts: Product[] = []


  totalRevenue = 0
  totalUnitsSold = 0
  totalClicks = 0
  averageConversionRate = 0


  revenueComparison: PeriodComparison = { current: 0, previous: 0, percentChange: 12.5 }
  unitsSoldComparison: PeriodComparison = { current: 0, previous: 0, percentChange: 8.3 }
  clicksComparison: PeriodComparison = { current: 0, previous: 0, percentChange: 15.2 }
  conversionRateComparison: PeriodComparison = { current: 0, previous: 0, percentChange: -2.1 }


  categories: string[] = ["Armazón", "Lentes", "Accesorios", "Lentes de Sol", "Lentes de Contacto", "Cristales"]


  Math = Math

  ngOnInit() {
    this.loadData()
  }

  loadData() {

    this.generateRealisticData()
    this.applyFilters()
  }

  generateRealisticData() {

    const baseRevenue =
      this.timeRange === "day" ? 1500 : this.timeRange === "week" ? 8500 : this.timeRange === "month" ? 32000 : 120000

    const baseUnitsSold =
      this.timeRange === "day" ? 45 : this.timeRange === "week" ? 230 : this.timeRange === "month" ? 850 : 3200

    const baseClicks =
      this.timeRange === "day" ? 320 : this.timeRange === "week" ? 1800 : this.timeRange === "month" ? 6500 : 24000


      this.products = []


    this.categories.forEach((category, index) => {

      const productsPerCategory = Math.floor(Math.random() * 2) + 3 

      for (let i = 1; i <= productsPerCategory; i++) {
        const price = Math.floor(Math.random() * 900) + 100
        const sold = Math.floor(Math.random() * 50) + 1

        this.products.push({
          id: `PRD-${this.products.length.toString().padStart(3, "0")}`,
          name: `${category} ${i}`,
          category: category,
          price: price,
          unitsSold: sold,
          revenue: price * sold,
        })
      }
    })


    for (let i = 1; i <= 5; i++) {
      const productCategory = this.categories[Math.floor(Math.random() * this.categories.length)]
      const price = Math.floor(Math.random() * 900) + 100
      const sold = Math.floor(Math.random() * 50) + 1

      this.products.push({
        id: `PRD-${this.products.length.toString().padStart(3, "0")}`,
        name: `Producto Extra ${i}`,
        category: productCategory,
        price: price,
        unitsSold: sold,
        revenue: price * sold,
      })
    }


    this.products.sort((a, b) => b.revenue - a.revenue)


    this.clickMetrics = []
    for (let i = 1; i <= 15; i++) {
      const clicks = Math.floor(Math.random() * 1000) + 100
      const conversionRate = Math.random() * 10 + 1

      this.clickMetrics.push({
        id: `CLK-${i.toString().padStart(3, "0")}`,
        productName: `Producto ${i}`,
        clicks: clicks,
        conversionRate: conversionRate,
        lastClicked: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
      })
    }


    this.applyFilters()
  }

  applyFilters() {

    if (this.categoryFilter === "all") {
      this.filteredProducts = [...this.products]
    } else {
      this.filteredProducts = this.products.filter((product) => product.category === this.categoryFilter)
    }


    this.calculateSummaryMetrics()
  }

  calculateSummaryMetrics() {

    this.totalRevenue = this.filteredProducts.reduce((sum, product) => sum + product.revenue, 0)
    this.totalUnitsSold = this.filteredProducts.reduce((sum, product) => sum + product.unitsSold, 0)


    const filterRatio = this.filteredProducts.length / this.products.length || 1
    this.totalClicks = Math.round(this.clickMetrics.reduce((sum, metric) => sum + metric.clicks, 0) * filterRatio)


    this.averageConversionRate = this.totalClicks > 0 ? (this.totalUnitsSold / this.totalClicks) * 100 : 0

    const getRandomChange = () => Math.random() * 20 - 10 
    

    this.revenueComparison = {
      current: this.totalRevenue,
      previous: this.totalRevenue / (1 + getRandomChange() / 100),
      percentChange: this.categoryFilter === "all" ? 12.5 : getRandomChange(),
    }

    this.unitsSoldComparison = {
      current: this.totalUnitsSold,
      previous: this.totalUnitsSold / (1 + getRandomChange() / 100),
      percentChange: this.categoryFilter === "all" ? 8.3 : getRandomChange(),
    }

    this.clicksComparison = {
      current: this.totalClicks,
      previous: this.totalClicks / (1 + getRandomChange() / 100),
      percentChange: this.categoryFilter === "all" ? 15.2 : getRandomChange(),
    }

    this.conversionRateComparison = {
      current: this.averageConversionRate,
      previous: this.averageConversionRate / (1 + getRandomChange() / 100),
      percentChange: this.categoryFilter === "all" ? -2.1 : getRandomChange(),
    }
  }

  toggleFilterMenu() {
    this.showFilterMenu = !this.showFilterMenu
  }

  resetFilters() {
    this.timeRange = "month"
    this.categoryFilter = "all"
    this.loadData()
    this.showFilterMenu = false
  }

  onTimeRangeChange(range: "day" | "week" | "month" | "year") {
    this.timeRange = range
    this.loadData()
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  formatPercentage(value: number): string {
    return new Intl.NumberFormat("es-ES", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100)
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString()
  }

  closeFilterMenu() {
    this.showFilterMenu = false
  }
}

