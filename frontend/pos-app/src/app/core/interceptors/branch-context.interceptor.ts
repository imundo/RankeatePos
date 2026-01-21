import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BranchContextService } from '../services/branch-context.service';

/**
 * HTTP Interceptor that adds X-Branch-Id header to all API requests
 * when a branch context is active.
 */
export const branchContextInterceptor: HttpInterceptorFn = (req, next) => {
    const branchContextService = inject(BranchContextService);
    const branchId = branchContextService.getBranchIdForHeader();

    // Only add header if we have an active branch context
    // and the request is going to our API
    if (branchId && (req.url.includes('/api/') || req.url.includes('/auth/'))) {
        const clonedRequest = req.clone({
            setHeaders: {
                'X-Branch-Id': branchId
            }
        });
        return next(clonedRequest);
    }

    return next(req);
};
