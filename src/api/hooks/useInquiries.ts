import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InquiryService } from '@/api/services/inquiry.service';
import { queryKeys, STALE_TIME } from '@/api/queryClient';
import type { InquiryDTO, CreateInquiryRequest } from '@/api/types/inquiry.types';

export const useReceivedInquiriesQuery = (page = 0, size = 50) =>
  useQuery({
    queryKey: [...queryKeys.inquiriesReceived, page, size] as const,
    queryFn: async () => {
      const res = await InquiryService.getReceived(page, size);
      return res.data.data?.content ?? ([] as InquiryDTO[]);
    },
    staleTime: STALE_TIME.MEDIUM,
  });

export const useSentInquiriesQuery = (page = 0, size = 50) =>
  useQuery({
    queryKey: [...queryKeys.inquiriesSent, page, size] as const,
    queryFn: async () => {
      const res = await InquiryService.getSent(page, size);
      return res.data.data?.content ?? ([] as InquiryDTO[]);
    },
    staleTime: STALE_TIME.MEDIUM,
  });

export const useCreateInquiryMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateInquiryRequest) => InquiryService.create(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inquiriesSent });
    },
  });
};

/** Update an inquiry's status — optimistic patch with rollback. */
export const useUpdateInquiryStatusMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      InquiryService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.inquiriesReceived });
      const previous = qc.getQueriesData<InquiryDTO[]>({ queryKey: queryKeys.inquiriesReceived });
      previous.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          qc.setQueryData<InquiryDTO[]>(key, data.map((i) =>
            i.id === id ? { ...i, status } : i
          ));
        }
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inquiriesReceived });
    },
  });
};
