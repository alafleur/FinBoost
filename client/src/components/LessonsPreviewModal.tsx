import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function LessonsPreviewModal() {
  const sampleLessons = [
    {
      id: 1,
      title: "How to finally stick to a budget",
      icon: "💰",
      color: "bg-blue-100",
      textColor: "text-blue-600"
    },
    {
      id: 2,
      title: "Cracking your credit score",
      icon: "📈",
      color: "bg-green-100",
      textColor: "text-green-600"
    },
    {
      id: 3,
      title: "Intro to investing—even if you're broke",
      icon: "📊",
      color: "bg-amber-100",
      textColor: "text-amber-600"
    },
    {
      id: 4,
      title: "Student loan paydown hacks",
      icon: "🎓",
      color: "bg-purple-100",
      textColor: "text-purple-600"
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-6 px-6" variant="outline">Preview the Lessons</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="py-6 px-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <DialogTitle className="text-2xl font-bold text-center">
            Quick Lessons, Big Wins
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            🧠 5-min lessons on real-life financial topics
          </p>
        </DialogHeader>
        <div className="p-6 grid grid-cols-1 gap-4">
          {sampleLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              <div className={`w-12 h-12 rounded-full ${lesson.color} flex items-center justify-center mr-4`}>
                <span className="text-2xl">{lesson.icon}</span>
              </div>
              <div>
                <h3 className={`font-medium ${lesson.textColor}`}>{lesson.title}</h3>
                <p className="text-sm text-gray-500">5-minute read • Interactive quiz</p>
              </div>
            </div>
          ))}
          <div className="mt-2 text-center">
            <p className="text-gray-600 text-sm">
              Join today to access our full library of bite-sized financial lessons
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}