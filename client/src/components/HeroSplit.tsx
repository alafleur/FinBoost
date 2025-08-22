import React from "react";
import step1_m240 from '@assets/screenshots/step1_m240.png';
import step1_m480 from '@assets/screenshots/step1_m480.png';
import step1_s304 from '@assets/screenshots/step1_s304.png';
import step1_s608 from '@assets/screenshots/step1_s608.png';

export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="pt-20 md:pt-24 lg:pt-28 pb-16">

          {/* Three-column split layout */}
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-12">
            {/* Left — gradient brand side */}
            <div className="text-left lg:text-right">
              <h1 className="font-extrabold tracking-tight leading-tight
                             text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                             text-transparent bg-clip-text
                             bg-gradient-to-r from-blue-600 to-purple-600">
                Learn Real Finance
              </h1>
            </div>

            {/* Center — Phone mockup */}
            <div className="flex justify-center lg:mx-8">
              <div className="relative max-w-sm mx-auto">
                {/* Phone frame with subtle styling */}
                <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                  {/* Status bar simulation */}
                  <div className="bg-black rounded-t-[2rem] px-4 py-2 flex justify-between items-center text-white text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                    <div className="font-medium">12:34</div>
                    <div className="flex space-x-1">
                      <div className="w-4 h-2 border border-white rounded-sm"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Phone screen with responsive image */}
                  <div className="bg-white rounded-b-[2rem] overflow-hidden">
                    <img
                      className="w-full h-auto block"
                      srcSet={`${step1_m240} 240w, ${step1_m480} 480w, ${step1_s304} 304w, ${step1_s608} 608w`}
                      sizes="(max-width: 768px) 240px, 304px"
                      src={step1_m480}
                      alt="FinBoost app showing winner notification"
                      loading="eager"
                    />
                  </div>
                  
                  {/* Subtle reflection effect */}
                  <div className="absolute inset-x-2 top-2 h-1/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-[2rem] pointer-events-none"></div>
                </div>
              </div>
            </div>KwCzJ/OVtNpKU2Y/ujEAE/M1fzYkkdH8vZqDo1qyxgDvr6NifAHXGVW8s7eC+OfubArNBAhT8Z0Sw7WygTzz8l8HKM3FX0+c7cqPdkjW1UgLeeGpRexKoQCShWwzgJnCVEKrePdHVgmBXJTOuK1k9vcOeBpd5vpTJZO0VCQz0Rg9yF1n/7skZAeCbVllFCRLhXtw+LsI9FbKpR+x+JtQwJYJe5vhI7z5YJaHzQ0ckYBpjfEsGkc3KNjrpjKM5JQPOEpO0YYn86DdPJpzRYJNhBo4eZE9PTZiKnJzpjNl/OHjcxKdVo7Z5BQPtOxSi3P19VwJeKqKPZBWpJe1MHJjN7d7fOzJgdpRBAKRAJOItoZDQjK/b5aIj+pWM8gjtL4H8LMpQDwN2Ul0pCQu56YCjN8eL3R3uIgZ7iUC9Y3xg9gLXbfWdJCHUcF3t7Xa1iBgaCtqTcKJ3C8XdJ1FnFbL1Oze0NTcrCJYkw7kQb5vPLCSMG37tCwzp8ZSDjAyE3ZT8zp6ZnCyvhAp+2RVJ3eV0ypMjAhj5GhDXk5SIBJiTwqYmY6OiuRbrvLmplOH2iT16KSNf/XhPVqxECiGqlKhajbmZYFcW3p4E2AZ8a50eOiVvlQy9sSMJ4yb1qNcJAA+ksB7dLOzPHiCdp4p6k5xDGzJAMdAF7Ol5IOBD+2VlB/kktZhK25y4GjW5Sv4qp5NAGVclh1LhE3AE1e8N/KYEqh3MUUnBXb7wYOWZaUfLvPpgGK4c3uwtO8urJkIIOAQO9BXJj7W3jbYKCNe0sWKhOhOBEr7j5I2yNSGz3vEn9mZ3+hCqnPPe1Kf29ivhPKOL/dkCK8WJqe/Yr0pAJ2u0hJ1TpNYBU7LwYmVXr+TjQkBuxeNm3G1dEUIuQGgSybG1BRVJhqP7+2I5T87b+lrJW3a3RwJFZr+OU1C1lWB8z3NjgWqN4vN6zjacFqSkMw9g2GSLZ8rOdp8nOVGa+7XlcGfzNULR3LQRkxhZaaTqIjJhMhSNs6lVnqcJR2/jy2HgGUiKqpOEXGm+ZFZWSKJLBsEiJ+z37mTK6T5O9H6Nla8EhzMz4Ow+T5VhHJCAeyRAi0wXgH/i9b+yCYKN+TkbdJGAI+9MXLe8t/9aUpDwJT/PLGjlXQ/JN4ztJPnBSf6t8sYiKa1CW0Nkm+bm/dbh3FQ4PTGWy7jZydhqc5tYNhSJhePUGwX9t5CfBs8B9rkE8K5FkYJuJFCbFfJKa/7aFBJ6thKBEI9UYlRJqGX8k+Y3CclCGawCVjYCf5FgS9LwQkpOJKCO0u6Y2lrWJr6CqBKKQjhsBOKWGaFIb93Vy8XN7h5wKJkqx4h0DP8NDSoEe+A4Tc+r0WpYfN82OjBP2UZHgkZOjWu05GW4YJQ8iZGAO5FnC7Yymt1v8Sn1aaXKiYCmUkJNkkzJ9DRqOHjb7mSC9qCT4vQVYrv4Jqnc5rNUdcqJ5gQFfxc6kLOVrCTb66HnpnJUWsV/3b7m6+QDdgCBHW1gDp5zFKpMGsJTSkByDPOEqH3w8NWq1Xvhv4qz7vKLxYklJMJbPNPEIpLCThOrvGb9Z2t/AvAUVlUd6eR01JRIgFfsVqTFZrE+8+1lOLLyS2xfnNftgSEQU8KJSFyANyZklqljWqJVJp0k/BsrbnLBWctS+P6l9GdEtfJyFmnBZlp5h5ISU/I8WzR21aRB9QKbh8KW1vD5+e/FgEv+vQwOUrAa7kVsJnETOYODuQZCHFgZ1V8hB2MgJKOZGssjCjWrwuJj5Kh5A1H3YR73i5Ou2t7A4m8I5L4O5wBDWLFvqBGBhxnOQS62MN3+kNCiY6ZzKh+k1/3iYPJYIeF5B3rDGcBkQMTsnFpQmvpQGzIGl9QfF3XMuOmvF6Dgd/l1T8CL6sSNvI7XLzjO8swfIZtlp1bz2T5q08n8xXrHGEBkrE1y5KAqnj8r3nHQkh6EYGfGNiLDSX8GYiOyKe8n2Rf7b6tfqfJqV9kJo5aW9hqbGHYrEUJWF8mI0z8BEJxKOWPmEJJIq7gzwEGdBwJUWmsjg6YKN1RQr6jGTFrUoEJ8ioHDIUHqKxd/v5e3Y1GDSI5Pd0olyYKGGpU4fCHQn4Cma8Zmy99X9y9jY6zPdyWFHUfP8nGIhj8LAXCbiyGKUkKiCBXfWqRfqJBB20mOK3pWGM2Hs6xfQpK1k4eB5KJw0LF9bOhCIvGNbJJJfBGKy8B6NgtMt3k1hfK1JQ3eGxBySh4ykVi46sGpKvyPTvMCeB5j9Pf2vCNJlPfwdYQHPCYeFO5Wjm5v9rq0vUvQ1x7SqxLJNF+qxadVK5e6wE9JT0P6zsSQZaVpbN7QNx2W4EB5aOBGVNHJqAcSYZMh32ZECM5MNaTjm7kUEtNqBgVG9gYMLW6gk5z7YmFxI7/ULMA5xEJrJN5lq33eDhN0K+JQJJ8k4W6DpLOIv2Y/Wfb3jJNL+LBJx1pj3Z3x+pZJhd5/K3KXEsHWQgVd4++tqGlXGdPHM5qy20rVRU5lmNiuCiETEiGrH3Yiun9z/66lGGJNAOt5hSAkJFxwOLmjYrWzurJ7T+n7Xr7E8V4fVYJaUnSWwg7cMZKaXJJ2BhzNlNAXWd0wCULfMvqedxSztzYmBqxCnAy4xqOXh1yJgDhk4k8C29raMDVtfnkJtHGZkpKc8jK2hSiQm6Rdy+CgGO8MmMBzY5uxNrKLqaV5bqVjFo2B2qTZeHQZeCY7ZaKH31CdmhGA/6sNd/r/xZbVaJHvPq5saqOKRmvC1zTsRgeMHhPZfqTdlINYe8T8ZFLO5iu7ixFDc93cyNKQkHO5zOXwYHBaRCqWtlOFABt7DF6pNDgd16FonE/iFSjWJmZl1VIFpJAFXs2ZrMQDWE7gppL5zJpMjCVRCIXhOLpNt9o7sxNJ1Z1JsKXlvklrJhRoJ9LTYIy0zBPb7hbGRnj1Qrl8lKF9YI8w8wNFEHmSAXO2BPGTmfg3rqYJqT8ZrUIf0Cn/ynAQ6nGWQ+7I1vT09wdYM9lOFvOmNyEJ3+bkm3fYAAjYCfzVe9FfcfU8C9g7GMAU1qPZmBEBK5tqoqVbBOlNOoFYlNRdOJgKPFZJNtHQqy4e+pC0DUeNvb90HmnZbF9hL6mR6q4ZIUJKBlGCKC6KKJBvY8W10YgMzB6xXCqaKz4JCCM3t4rPKhRALYLGwdJOANz6zWMbOhqLM2jLwJIp6EXcR1p8pK5yCJVfGQK7ZwEyJxL9xjvCF4LdGG9y1VHhKRlIVLZrYBh4v7JLQPz9mQp9MQGn2n5v8u+r22Bl7n/BZJKOTsYjChKSVm1BdwQH5dVGDDILvBNW49qW8mD8AqJLrbrOFqzCm1l5fcYZH8/dJmhEOEZMCfOjzGEgN4t5lE4qPyM/nKn9nkgASMOu5+53lllHAOhxDVaOdcQYu5B5q5aZUGqDJpFKlf5kJE7KRgJGd14cQQV2lIGITULx93r2VXLfWcKE/2m+vwhzOLJp6LCNZeJdOBl4SjROW+PcG++JZx5J4IPNKrGOcrOZAA8VAYOr7N3DK8mF8HO8sJ1M35vc5AJyBmG3t+fxFJeKdPGxP4ohdTtJY3lZTR/Lhe6j7lJfSlLgb8w6G4Tv+HGg/F7qAzKF1cDzs3q9Y5Rvq4GhMEzIhkdSIGU6UlZXhKtI8zNEV9hG3e2GhAI67s55OjVJy6fFKtdGDhOh+FNkKW5f4EqgW5vl4S8kFkc2/Zl6qMGhiF6d3ZrfN6Q6N2Pf8rSyULr+i1Y4fPrXRkTJy19YhONYjHRd5c2PwqJOTZG8lCmYdPxebEgDIzPW6SXr+dtvBbvj7Uxc8KdZZo9LrY9V5hj8nJ29P5LIo6TckX5+WfJxLcJi3LYB7PjW9xeXuaV5rKEXqRtA2xP7FZRVaSTEF3u7uF6VLvGFTaJEYsJNDGHCbY4gYJgXYkYNHexHK6JqaRgP5ek6m8+TuGb8ZP8hM5OL0jzqEFOTuS0Cn+fJ6pOyiYlBKdOKYMc9MHQ3Df16OmOJ5JdJp7XUvDdSz3VwlWFzIJKznoSQZKSTm5Ek1IB9a1tqnP+3/Mjfsy8gplJGvT9qrJd8OQBG5MsKO/+5qtb6O2s8FAQlGFSR+OyCBAEozaHYZSLvVOQyOBRzKQIhq/EgBnfpK5tFP/lhyKKrD1sLJINKykCQGYksAmOqA3ej3uaQ6xI5mQ8tK9hG9YLhOeYo2QLXpD3JLHQ7TXXkqpRa1FgF8cPG2PY1dWGo/T3oE7u+1O/yGqEqR9H3z9ug6BNPHVw5DvHH6Rh6slEbpWH4uHaWVm3m6soOkNpNg7/Hze+v95fmuU9q7kIDPyg7WKqQkgzp/8fj3/hYOi2OxhVkESSjVGYj5T+i1c2h3jR9Ic5AJiYqbwTEuS8Hj6PYaJYgEHD1/WQVlpP+dJ8fzLwJhNwIRFnZ2r2YrW3YXl+y5dPnJu8JVeI4CQNlArI5V1xKa4LKtPK5xQfr8rpD7LgnBHcG7sO+BcJkjKQQYwBvI6rZmNRJwcWHE78hm3flZpOFsHXqKN8+b4rRf8lC2Y8uAC6ZBl1NE3PQhpEMgSSDR4rLh3K8OTlDvQfIlJpFGduvLCtpw8M7A//vOJMJGHhoySgkZqfh9rYE7H4QE4jHJZkGUlS8UZUqGjOEYW1Q5UHdFBDgDJb3mMqIHZ8KY6IjO3pKaQKCNBDKwzgzIKEQkxqe5A8Q0MNfCyF9KSEM0YHG+/jNPJOCU7v5cI+YtZ6YQ+46LZX5jQd4EGfOQbNv3aAiGwFN4LrJCNJUEJGcggwHQoMLVgSSFR09tK5voOLJwpYFoFV4CCLZDRxZEuJyOJn9cDJnz9E7JgDN2+QKHGLPHJhJAR+ybKTCPjE7DNNM7Gm0l4Jjf7qzQy+wdVZpNSDHfgaFDRyDo1z4OVzpB8xhZC8DZkC+3lXhEn5Ej1KEjjzLPXQmJQu6yKSP3aMuMohlplUPjq4vJKIb0e9KYP/8mfhZxCRgYfcHWN9qXa6s3dfKQEuJ6JqZXv6S7s6OslbYk4G1fKHlb0MoTETgiMp8rnxvM2NDDW2VoZKgtSVgZbVyLzaIwSzjRhKyeZhG9I8ETlZh7nDpJ3m1GxhEUhF/K0Ke5g7GWI+/hwPQJKO7eMcPJOC/WiAOJ8gNMhVYCIiOBLRNb/cGGZrBBG8XjlU6zLBnRVZ6Q7SRGg8hJEXhPgbAQa8rq6bEYE+JGAOCNRWZNRqz7K7zYq6tOL4cqcQ9PfMFSQyQOZKbw3gPZCG+4mI8kP6t1k6eSBXc8OSlGQYGUIqxA4Lz0QSEw8mQcKFz+AKEzNEQIzNBu3Pk5ZsEoH3bAo+I/4o/6Xr7W4VxkLZKS6Vx8sFgKA9Y2/3tS/mLKdqVqW1pCaGOJpEItGUHT1u6e3ZBfGpGJaZm09oCHJ9k7eHs4+7Ayhqm4uxXhJ8oe+Ff6HHmzFJO2oE4vUNZGG2YgbwXgKOXRqD9bh8xhD5m7A2K1YC9kNYV7n2Aqj8eLKKGAyYKwedySCclJSiJJNlbEfJenewmJ8Z2KbQ1NB4L+QjJGm5D3o8jJ1lklqH3nw8q8p+Pfd4YpQq4J2M5FApCRiJPqZFqXewuSjPo0/G3fXcaJHN6BhRVOuE82F4aHB/3wqEhYrBFwuFXS1WNY0Z4gUWHBKoWL3AhGj9QQJcynFCKqfPBIZg6DU0Vkqx0TJ6RNE1a8eE7OqOYktnyeNO1pBXlJoEJjXy0AZcL7Gl2Q2oHG6BoELGOO+KOFjFLBllH7A2CVs7WnKvjnKHq44JJB7Z1e8NgcIiEbL9fVlGhP+81fWekFJyglsb+ZCE4YMX9O+/9zU1HTgLKaHDzSPLiI2vNaEJGeEQqTHh6kbGWJhpL9hwg/VbKgklWY6N8eOG/yAf3iq8PsaPFfgMI2kq16WTgI3NpP/5T3sQKLEP1nJa1sM8ckYGAYL4T3DVEUB9+LvWJOBVCzQ7hhf4vdSqrJfKqL+VGYCj4Ej3PTiTrPVRe3a5nJOAvCDVJQPnYPTjkqz7lH1vHg92zlZ4mwJ1iOwu3qYAH2HVQw0Q9XxRqAD7kKStBJJzMCG1RVgx47DZNVN6+2NlSNiVTUe3fLBRrYJOlg4hB1Pq1kVepFjLHbcvJnMSJkkA5CY5eCICrfNf6sDHHW17I88XB4+dS8a3lM9WsJFJBDY3kIGgdLHE6CxzKn3jOJACB+MYUNt7oD9o8u7Bp+9ULy1DnSa9RN3v6vq5Lj+b66WVXuCRgdWrMZjEqeOLOZQ7JKGBAIZRyLYkMCUOhiJ4ZlOo6CJjlDX/E6wkHdqWQ0xzNaFKQb89o2oRTFxYEpCATpjqk0CpMrFhqGYKAFLkOSS4iyY8g8pJvuXQoJlEr9ZV3i1ZuBD6U2GGNwZZ6TKrYBL6tEQpnOjQ8H/6o+U6eGF6vdGdSj9XTpK7b2lReLTQzC12MK7R4i6knmz6LMPBY7CZ9xJMKZEkI7G7FVkGzH6uHXEAEQj8zKKXJBAb/z7iQQ4gOg0DKj9mI7vMEIBUdJ+VHWx24xQZAn4M5HAMb0TnlBU4LrKwcQJaJ9W62vVaHEt4jdqHNOwJePBZhZy5WMQRg8qKd3n84xY7yX5J7Vo+vVVdWJOAtzZWXqbOJGB0lpNGdQgXHTAiJdtDLsNOLMzOr6nOqf5J5NUP8gOmJE2DY8+LebNfKzU5S3eVJiKPJtIZOE2s48PvRw8nLdHg+90tE0ywLsUOLKPPEMvFOQMJGqjLKu4tqOz3e7qk3Z2A9qWREGM8+Pk4mZ0Pn6JpqkNdNKhz2TTe0ikNdh+1hM+KN2OJNqNVBB2wj25IYJd4M2XJGDBKE7RyFJpNCGBlCLEGGGxH6nfwuqRH2fEfB4yvHXvLKgKa0vNQC7KgEiAl1hHnR9BKVdOPU9G0ZNB9JCTvlU4hYI7lc7pJ0PZ4Dy8R6vO5YQJyXUzTrLNqVE9i5zN+3+vLKJM8aDPgUjJ0IKHq7ZW+hAOKLEHdepF8e79qILawB6wSiKnGKnIB8SXQf7xHuQAO/hZJEtB6W/8nnJAQHQiYyKQSK8tCDW7rYMgEAW+9cKDvbmxhJ/kUGdCSDQywU5k5K/Gr+xK39x8zN29u2jdBQasBtxZl59JHrW9J/gNx1pGaVA9cP2IgOtNON5NXtLnfJSb/8/mfCH2Q7vQ1DXMdOACzv3+7fzZfH7TZwj8D+7Q/2DP7LNHhbO8nHOA4c5Ls6IrF+yCBUpERkkZ+5n7FkUETJFCfKMgEVGOJE7VB6F6zfQYIoOFTvAO/3khyKDFa7w5eFIJsO5VwF/R9N3o+4LkTlRKQCnEm6VUJhWfMa4uJFglPSJv3Np7HBfmEHGnvp8fDe9OC5AQodrWLu1qS5sKZNRlSE6rrZkm//KrH8vnfNrCYQ8ksVeOHrjwOgN+5O5xLWRSx3WrN/s9Piq3r/FHoVJd/vq96FoKGDKBQIE3lTyLI3hJAl37JYU2Eap+W73vWztxYKRzqnWTNdh6tBpJmVcPHd/rp+JAEuNeAWNs5Wr3Ge9TrV/K3/zKJJNEzOHf2TjKNJO8q5lKCe4MCtv/8HxzQVKr7EqQfZlJvDFMjAfvqQDiSgBR5sJ9NQXQ+/JKYNlPwT8DyQgK+0jm8q+l4gT2/fP7OdEGm/bXqcW9vH5dAe+vvOxJwIIGDUXpn7XGa98nO7e2TfXzDNDIDjy9RySdY5lB7loxv3fGk9PSc+8JQFgm3AyKZ4iJEqXp7vVYUq9bqXPi6RgIu7TUrE+fthXqMYfFd6w73l6o7L5d3lIepPL7KOQ8JB7kP4MZu+x/J4FhIbcWxl/nBkEBKQGaRaBNWN8dJpnN3wqrJU7dzkLhD8zF5xqyJoN0Iu8jEfBeSMYxnR9lgJGSX2w3WC8YBQSuJqOWNzRzNFhKI9xsJO1JkOwAMa1vCqHyJ+ZlJeG3M+PH85qrU5uiC9wN5i8gKdS5GKdeCuBR+Xt9JwG5cO8J9sTCyK2J19qMB1o4OJIMJFXQnhFtfKPYcqxvEkdcJVBxhqVJRVHEqvr8oRmOQ6fGqwJ0RW0g5d6U3i9OMSWOe1w+H8DM8DIkYhfD4hZBdJAz7ztlNlIQM3gRJGKJjPXVuT2dFZOl+YAj/koHqKdBXJKbdUaVfTKlWkZdShYnb3N6JdxdZwZ4J9g1WELYHCQgnfAAz6H9+zOPKF4iGjS2n7vRHe3xzEP3O+2+xjIxnRlZ22VH5ZNJGFJKYGDnOTCJgfUAuSrZOV9tqKkFdPfOulHjbT3dJGLvVdYJVZJc4i9oKBhK5nfLfGrIV6X0iMOK6E69yF4RUoM5IEpqQjlbS//7Xd3dJKC2hXDDDJJjKKRSSIhTWJsF1I5QgY3k+s7rTFa2vu6r2LLn/oT8WlsqxUeNj9KIjvLi2M6+tKz/4bPD7exIMqZ+bE1KRSADJC2YSiDvR7J+hHGXCFhKLdpLjJOh8xUJ6F8LjdVhTfHdHdP7g8D/3ggxVmCY5LbIhLtjn+XznJ6pSrnP1lJu/50GPCEX6U23xW51lU8yzAz3ZLVr9/dXNy5z/ZYE9G0KFO8LGDEJ1qZQNsyGzGH4Qq77bAjFe9rvOy5wPZ0U3q1KPqsK7jnqnO1K0r4oJaDQdR0Q8j4SoBmNP7JAo3nJYLq+VFEKaVSvCUzpHtlCOhSLdg7s09oB0LR1wD7gYNOdcQ14Dv0LCTNfHBe4tqTEhTZM0wGo6qKk4rUKmqhfCRtcJJp5QgJGUthUZaZzMXLXI7E1gBvVhNOw7T8RMEV4pD9Gk9QkxBgdvlgOwVm1QCNnjETf1C2dK1QNRx/0O4qMXKngCJqN4RfNhYLsqy0qllF6gCLWW+hLBcz+8oGAfbUwVDaRUKHfVoktN3dVIxJQjcN9RCY4S86FO1hFkCX9DcLaRWdDZhgGe7J0BsOFGsGVdKQhGV2HPfQzFdGvJKBYf7PqyEEL3h+iJOKxf7bVYJnUTJ6NACxsaL+NHr0qJyKDYuJp/eTcWWEi16pzJbdB8NHdZfb6HTT4i8haBf1TbkKJRJ+DKcHOJOBPyGwPwmUr5Xn/7KwvOT0bgtOxJFe6e8A/wqYhQhR1ZPp37zGMX1H7z7YogJxb9qBAcRIqn8bEV7E8qPAi9t9U/mY/rwrg/jcdQlZn8RwYwu0xEhCN9g2Fgb0Fam/Qgpn7LHN/I9k1cg3Uy5aZI4Eebwh27J2bgOy4SrqOLW3lvXdOm5eFIpGzJ9XkS3GqlgTz6mOi7hfZhZKNM8jf7FV5ZYnolqcM9CcJOPUGSLNIJaOfJeC3FGEbr42LjRz/jRDZeGI0C3k5WSfNJJjKZPqxShw1p1FQmXFPpUz8g9F96J4XNzShGhEsYBHb+jNBAhS6JuJ1lrWddZAjFPG3d9M13lUWl5uNOUVVJ2z1J+zVOeT/T+8iQxJwEIQzO5vNg/bPmqE6K6edjE7q8m8+J0AY6oUNT0qEY7n9WNhDO5Br9aRTNXZ1d3cXx+hDp1rXdP/fNwmEJEOZMr85EXByxTsQQhKz8VQsyf6mCKLOyq22/1lF9CUJaGzKOtpUEyJYYpVyXOLFUlNJJ9LgUNWBiMgEfkr7bKkXMqmE9QZeJH/7d2n7O7yL1CrXoZN4MJsN88qVnzHOvY1z7RwJgPe6uW+6xOhMqKTcCa5VPH9DxH2S1Oe/ggfuS8y2O1e1zZTfE6m3zbeyZkgLiN+hkq8KSTcq6nLSMUQ+6xfmR+gQNgCDGQIZGVeVKgk9JZPS7hLu0oHf8oQqOWnfNdJaZnZRWJt/xzowNcmOu3sPCPybVJFQyv8rQvNj10oHEUgJaH/Jz8qhNWxIrJH1uKfSKFoZBMd9DgdeTzKaXMhYUJ+Ox2mNhCQ8qO+k7X8XhsHpHKpTvYZmkdRbTCbYFbm5vRAo7NKnrLjxJD6c0QLBX5k/aJL9Oqn3gqHQl8rdPVzKSSqbUKq3FBLA+6/Wk4Cjt6qOgnf+EZL1e0w7aTc95VCPKvOEd8bDdS9RbhWu93aPqfZWFxEJyLLdYKktpj1jt7ZO1rfGb+dJJpCKQKeVkdVYVeKf6fWZMGXrvD88J+xf0Xs5BX21PzJHAj4nVvFEEAFf+QLdJoUQaXfXjwTsq8Z0vnHQp7eEVcA9E9K1Lj6hUhJUVXuXJxE0Uc2tY2a2c8cOK1nnWbDm5IjJnHovMDceFOYzH2BZo9xzgfQKojz9/VQjT7E9Yl8e6Qxb1Xzr90vKJ6Q1SjT2IrJUqpJvKFq6/1LFU6lgJBrX4SLyPLlUq+VuSU0rnKnNNm5Wy/lM2V8rNdKa8ky7YsSkbP3+pL1Tz4N4ggqxX3MjKRdOKOhCJzuI3LqQu1HCZ7yrVvr1wdQr3fHbXfGU3xJK3s8l4bO7wn//+QhgykD9H0fgXZAAAAAElFTkSuQmCC"
                    alt="FinBoost App Winner Notification"
                    className="w-full h-auto rounded-2xl shadow-xl"
                  />
                </div>
              </div>
            </div>

            {/* Right — earn side */}
            <div className="text-right lg:text-left">
              <h2 className="font-extrabold tracking-tight leading-tight
                             text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                             text-slate-900">
                Earn Real Cash
              </h2>
            </div>
          </div>

          {/* Clean subhead */}
          <p className="mx-auto mt-8 max-w-3xl text-center text-lg leading-relaxed text-slate-600">
            Complete financial lessons and real-world actions to earn <span className="font-semibold text-slate-800">tickets</span> for weekly cash drawings — free to join.
          </p>

          {/* Simple CTAs */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/auth?mode=signup"
              className="inline-flex h-12 items-center justify-center rounded-lg px-6
                         font-semibold text-white shadow-sm
                         bg-gradient-to-r from-blue-600 to-purple-600
                         hover:from-blue-700 hover:to-purple-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Start Free
            </a>

            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-lg px-6
                         font-semibold text-slate-700 
                         border border-slate-300 hover:bg-slate-50
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              How it works
            </a>
          </div>

          {/* Legal */}
          <p className="mt-6 pb-16 text-center text-sm text-slate-500 max-w-2xl mx-auto">
            No purchase necessary. 18+. Odds vary by number of tickets earned. <a href="/terms" className="underline hover:text-slate-700">Terms apply</a>.
          </p>
        </div>
      </div>
    </section>
  );
}