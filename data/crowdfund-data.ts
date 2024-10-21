export interface ICrowdFundingDataForContract {
  title: string;
  description: string;
  imageUrl: string;
  targetAmount: number;
}

export const CrowdFundingDataForContract: ICrowdFundingDataForContract[] = [
  {
    title: "Pembangunan Masjid",
    description: "Pembangunan Masjid Al Akbar Surabaya bagian timur",
    imageUrl:
      "https://ik.imagekit.io/tvlk/blog/2024/07/shutterstock_2386747757.jpg?tr=dpr-2,w-675",
    targetAmount: 1000,
  },
];
