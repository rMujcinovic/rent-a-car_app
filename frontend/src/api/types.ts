export type User = { id: string; username: string; role: 'admin'|'user' }
export type Car = { id:string; brand:string; model:string; year:number; category:string; transmission:string; fuel:string; seats:number; dailyPrice:number; status:string; mileage:number; description:string; images:string[]; createdAt:string }
export type Extra = { id:string; name:string; pricePerDay:number }
export type Reservation = { id:string; carId:string; userId:string; startDate:string; endDate:string; pickupLocation:string; dropoffLocation:string; notes:string; status:string; totalPrice:number; extras:Extra[]; car?:Partial<Car>; username?:string }
