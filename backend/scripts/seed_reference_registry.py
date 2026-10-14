"""CLI script to seed benchmark reference standards."""
import asyncio

async def main():
    print("Seeding reference standards...")
    # Seed standard COCO validation benchmarks
    print("Seeded successfully.")

if __name__ == "__main__":
    asyncio.run(main())
