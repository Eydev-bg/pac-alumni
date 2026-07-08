<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait ApiResponse
{
    /**
     * Success response.
     */
    protected function success(
        mixed $data = null,
        string $message = 'Success',
        int $code = Response::HTTP_OK
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Created response (201).
     */
    protected function created(
        mixed $data = null,
        string $message = 'Created successfully'
    ): JsonResponse {
        return $this->success($data, $message, Response::HTTP_CREATED);
    }

    /**
     * Error response.
     */
    protected function error(
        string $message = 'Something went wrong',
        int $code = Response::HTTP_INTERNAL_SERVER_ERROR,
        mixed $errors = null
    ): JsonResponse {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        // SECURITY/ROBUSTNESS: Controllers often pass an exception's getCode()
        // here. Exceptions from the DB driver, JWT, or other vendor libraries
        // return codes that are NOT valid HTTP statuses (e.g. 1000, SQLSTATE),
        // which would make response()->json() throw "HTTP status code X is not
        // valid". Fall back to 500 for anything outside the valid range.
        if ($code < 100 || $code > 599) {
            $code = Response::HTTP_INTERNAL_SERVER_ERROR;
        }

        return response()->json($response, $code);
    }

    /**
     * Validation error response (422).
     */
    protected function validationError(
        mixed $errors,
        string $message = 'Validation failed'
    ): JsonResponse {
        return $this->error($message, Response::HTTP_UNPROCESSABLE_ENTITY, $errors);
    }

    /**
     * Unauthorized response (401).
     */
    protected function unauthorized(
        string $message = 'Unauthorized'
    ): JsonResponse {
        return $this->error($message, Response::HTTP_UNAUTHORIZED);
    }

    /**
     * Forbidden response (403).
     */
    protected function forbidden(
        string $message = 'Forbidden'
    ): JsonResponse {
        return $this->error($message, Response::HTTP_FORBIDDEN);
    }

    /**
     * Not found response (404).
     */
    protected function notFound(
        string $message = 'Resource not found'
    ): JsonResponse {
        return $this->error($message, Response::HTTP_NOT_FOUND);
    }

    /**
     * Paginated response.
     */
    protected function paginated(
        mixed $resource,
        string $message = 'Success'
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $resource->items(),
            'meta' => [
                'current_page' => $resource->currentPage(),
                'last_page' => $resource->lastPage(),
                'per_page' => $resource->perPage(),
                'total' => $resource->total(),
                'from' => $resource->firstItem(),
                'to' => $resource->lastItem(),
            ],
        ]);
    }
}
