import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  number: string
  clientName: string
  clientRut: string
  clientEmail: string
  clientAddress: string
  description: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  amount: number
  status: "paid" | "pending" | "cancelled"
  date: Date
  cae: string
  caeExpiration: Date
}

interface ChartDataItem {
  label: string
  value: number
  percentage: number
}

@Component({
  selector: "app-billing",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./billing.component.html",
  styleUrl: "./billing.component.scss",
})
export class BillingComponent implements OnInit {
  // View management
  activeView: "invoices" | "create" | "reports" = "invoices"

  // Filter and search
  searchTerm = ""
  filterStatus: "all" | "paid" | "pending" | "cancelled" = "all"
  sortBy = "date-desc"
  showFilterMenu = false

  // Invoices
  invoices: Invoice[] = []
  filteredInvoices: Invoice[] = []

  // Invoice modal
  showInvoiceModal = false
  selectedInvoice: Invoice | null = null

  // New invoice form
  newInvoice: {
    clientName: string
    clientRut: string
    clientEmail: string
    clientAddress: string
    description: string
    items: InvoiceItem[]
  } = {
    clientName: "",
    clientRut: "",
    clientEmail: "",
    clientAddress: "",
    description: "",
    items: [],
  }

  // Form validation
  clientNameInvalid = false
  clientRutInvalid = false
  clientEmailInvalid = false
  clientAddressInvalid = false
  descriptionInvalid = false
  itemsInvalid = false
  isSubmitting = false

  // Reports
  timeRange: "week" | "month" | "quarter" | "year" = "month"
  reportData: {
    totalAmount: number
    invoiceCount: number
    averageAmount: number
    pendingAmount: number
    amountTrend: number
    countTrend: number
    avgTrend: number
    pendingTrend: number
    chartData: ChartDataItem[]
  } = {
    totalAmount: 0,
    invoiceCount: 0,
    averageAmount: 0,
    pendingAmount: 0,
    amountTrend: 0,
    countTrend: 0,
    avgTrend: 0,
    pendingTrend: 0,
    chartData: [],
  }

  chartData: ChartDataItem[] = []

  constructor() {}

  ngOnInit(): void {
    // Initialize with sample data
    this.loadSampleData()
    this.addInvoiceItem()
    this.applyFilters()
    this.loadReportData()
  }

  // View management
  setActiveView(view: "invoices" | "create" | "reports"): void {
    this.activeView = view
  }

  // Filter and search
  toggleFilterMenu(): void {
    this.showFilterMenu = !this.showFilterMenu
  }

  applyFilters(): void {
    let filtered = [...this.invoices]

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (invoice) => invoice.number.toLowerCase().includes(term) || invoice.clientName.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (this.filterStatus !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === this.filterStatus)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case "date-desc":
          return b.date.getTime() - a.date.getTime()
        case "date-asc":
          return a.date.getTime() - b.date.getTime()
        case "amount-desc":
          return b.amount - a.amount
        case "amount-asc":
          return a.amount - b.amount
        default:
          return 0
      }
    })

    this.filteredInvoices = filtered
  }

  resetFilters(): void {
    this.searchTerm = ""
    this.filterStatus = "all"
    this.sortBy = "date-desc"
    this.showFilterMenu = false
    this.applyFilters()
  }

  // Invoice actions
  viewInvoice(invoice: Invoice): void {
    this.selectedInvoice = invoice
    this.showInvoiceModal = true
  }

  closeInvoiceModal(): void {
    this.showInvoiceModal = false
  }

  downloadInvoice(id: string): void {
    console.log(`Downloading invoice ${id}`)
    // Implementation would connect to a real API
  }

  sendInvoiceByEmail(id: string): void {
    console.log(`Sending invoice ${id} by email`)
    // Implementation would connect to a real API
  }

  cancelInvoice(id: string): void {
    const invoice = this.invoices.find((inv) => inv.id === id)
    if (invoice) {
      invoice.status = "cancelled"
      this.applyFilters()
    }

    if (this.selectedInvoice?.id === id) {
      this.selectedInvoice.status = "cancelled"
    }
  }

  // Reports
  setTimeRange(range: "week" | "month" | "quarter" | "year"): void {
    this.timeRange = range
    this.loadReportData()
  }

  // Form handling
  addInvoiceItem(): void {
    this.newInvoice.items.push({
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    })
  }

  removeInvoiceItem(index: number): void {
    if (this.newInvoice.items.length > 1) {
      this.newInvoice.items.splice(index, 1)
    }
  }

  updateItemTotal(index: number): void {
    const item = this.newInvoice.items[index]
    item.total = item.quantity * item.unitPrice
  }

  calculateItemTotal(item: InvoiceItem): number {
    return item.quantity * item.unitPrice
  }

  calculateSubtotal(): number {
    return this.newInvoice.items.reduce((sum, item) => sum + this.calculateItemTotal(item), 0)
  }

  calculateTax(): number {
    return this.calculateSubtotal() * 0.22
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + this.calculateTax()
  }

  createInvoice(): void {
    // Validate form
    this.clientNameInvalid = !this.newInvoice.clientName.trim()
    this.clientRutInvalid = !this.newInvoice.clientRut.trim() || !/^\d{8}-\d{1}$/.test(this.newInvoice.clientRut)
    this.clientEmailInvalid =
      !this.newInvoice.clientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.newInvoice.clientEmail)
    this.clientAddressInvalid = !this.newInvoice.clientAddress.trim()
    this.descriptionInvalid = !this.newInvoice.description.trim()

    const invalidItems = this.newInvoice.items.some(
      (item) => !item.description.trim() || item.quantity <= 0 || item.unitPrice <= 0,
    )
    this.itemsInvalid = invalidItems

    if (
      this.clientNameInvalid ||
      this.clientRutInvalid ||
      this.clientEmailInvalid ||
      this.clientAddressInvalid ||
      this.descriptionInvalid ||
      this.itemsInvalid
    ) {
      return
    }

    this.isSubmitting = true

    // Update totals for all items
    this.newInvoice.items.forEach((item, index) => {
      this.updateItemTotal(index)
    })

    // Create a new invoice
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      number: this.generateInvoiceNumber(),
      clientName: this.newInvoice.clientName,
      clientRut: this.newInvoice.clientRut,
      clientEmail: this.newInvoice.clientEmail,
      clientAddress: this.newInvoice.clientAddress,
      description: this.newInvoice.description,
      items: [...this.newInvoice.items],
      subtotal: this.calculateSubtotal(),
      tax: this.calculateTax(),
      amount: this.calculateTotal(),
      status: "pending",
      date: new Date(),
      cae: this.generateCAE(),
      caeExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }

    // Simulate API call
    setTimeout(() => {
      this.invoices.unshift(newInvoice)
      this.applyFilters()
      this.isSubmitting = false
      this.resetNewInvoice()
      this.setActiveView("invoices")
    }, 1000)
  }

  // Helper methods
  formatDate(date?: Date | string): string {
    if (!date) return ""

    const dateObj = typeof date === "string" ? new Date(date) : date

    return dateObj.toLocaleDateString("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  private generateInvoiceNumber(): string {
    const prefix = "A"
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    return `${prefix}${randomNum}`
  }

  private generateCAE(): string {
    return Math.random().toString().substring(2, 16)
  }

  private resetNewInvoice(): void {
    this.newInvoice = {
      clientName: "",
      clientRut: "",
      clientEmail: "",
      clientAddress: "",
      description: "",
      items: [
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
    }

    this.clientNameInvalid = false
    this.clientRutInvalid = false
    this.clientEmailInvalid = false
    this.clientAddressInvalid = false
    this.descriptionInvalid = false
    this.itemsInvalid = false
  }

  private loadSampleData(): void {
    this.invoices = [
      {
        id: "1",
        number: "A0001",
        clientName: "Empresa ABC S.A.",
        clientRut: "12345678-9",
        clientEmail: "contacto@empresaabc.com",
        clientAddress: "Av. 18 de Julio 1234, Montevideo",
        description: "Servicios de consultoría - Abril 2023",
        items: [
          {
            description: "Consultoría estratégica",
            quantity: 20,
            unitPrice: 2500,
            total: 50000,
          },
          {
            description: "Desarrollo de plan de negocios",
            quantity: 1,
            unitPrice: 15000,
            total: 15000,
          },
        ],
        subtotal: 65000,
        tax: 14300,
        amount: 79300,
        status: "paid",
        date: new Date("2023-04-15"),
        cae: "12345678901234",
        caeExpiration: new Date("2023-05-15"),
      },
      {
        id: "2",
        number: "A0002",
        clientName: "Comercio XYZ Ltda.",
        clientRut: "87654321-0",
        clientEmail: "finanzas@comercioxyz.com",
        clientAddress: "Rambla República de México 5678, Montevideo",
        description: "Implementación de sistema de gestión",
        items: [
          {
            description: "Licencia de software",
            quantity: 5,
            unitPrice: 8000,
            total: 40000,
          },
          {
            description: "Horas de implementación",
            quantity: 40,
            unitPrice: 1200,
            total: 48000,
          },
          {
            description: "Capacitación",
            quantity: 16,
            unitPrice: 1500,
            total: 24000,
          },
        ],
        subtotal: 112000,
        tax: 24640,
        amount: 136640,
        status: "pending",
        date: new Date("2023-05-02"),
        cae: "23456789012345",
        caeExpiration: new Date("2023-06-02"),
      },
      {
        id: "3",
        number: "A0003",
        clientName: "Industrias del Este S.A.",
        clientRut: "45678912-3",
        clientEmail: "compras@industriasdeleste.com",
        clientAddress: "Camino Maldonado 9012, Montevideo",
        description: "Mantenimiento preventivo de equipos",
        items: [
          {
            description: "Mantenimiento preventivo línea A",
            quantity: 1,
            unitPrice: 35000,
            total: 35000,
          },
          {
            description: "Repuestos varios",
            quantity: 1,
            unitPrice: 12500,
            total: 12500,
          },
        ],
        subtotal: 47500,
        tax: 10450,
        amount: 57950,
        status: "cancelled",
        date: new Date("2023-05-10"),
        cae: "34567890123456",
        caeExpiration: new Date("2023-06-10"),
      },
    ]

    this.filteredInvoices = [...this.invoices]
  }

  private loadReportData(): void {
    // This would normally come from an API
    // Simulating different data based on timeRange
    const multiplier =
      this.timeRange === "week" ? 0.25 : this.timeRange === "month" ? 1 : this.timeRange === "quarter" ? 3 : 12

    this.reportData = {
      totalAmount: 439505 * multiplier,
      invoiceCount: Math.round(5 * multiplier),
      averageAmount: 87901,
      pendingAmount: 174155 * multiplier,
      amountTrend: 12.5,
      countTrend: 25,
      avgTrend: -5.2,
      pendingTrend: 8.7,
      chartData: [
        { label: "Ene", value: 320000 * multiplier, percentage: 65 },
        { label: "Feb", value: 280000 * multiplier, percentage: 57 },
        { label: "Mar", value: 350000 * multiplier, percentage: 71 },
        { label: "Abr", value: 420000 * multiplier, percentage: 85 },
        { label: "May", value: 439505 * multiplier, percentage: 89 },
        { label: "Jun", value: 0, percentage: 0 },
      ],
    }

    this.chartData = this.reportData.chartData
  }
}

