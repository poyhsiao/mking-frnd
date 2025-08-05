import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const About: React.FC = () => {
  const values = [
    {
      title: 'Authentic Connections',
      description: 'We believe in fostering genuine relationships based on shared interests and values.',
    },
    {
      title: 'Safe Environment',
      description: 'Your safety and privacy are our top priorities. We maintain a secure platform for all users.',
    },
    {
      title: 'Inclusive Community',
      description: 'Everyone is welcome here. We celebrate diversity and promote inclusive interactions.',
    },
    {
      title: 'Quality Over Quantity',
      description: 'We focus on helping you build meaningful, lasting friendships rather than superficial connections.',
    },
  ];

  const team = [
    {
      name: 'Alex Johnson',
      role: 'Founder & CEO',
      bio: 'Passionate about connecting people and building communities.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    },
    {
      name: 'Sarah Chen',
      role: 'Head of Product',
      bio: 'Designing user experiences that bring people together.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Head of Engineering',
      bio: 'Building the technology that powers meaningful connections.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About MKing Friend
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We&apos;re on a mission to help people find meaningful friendships and build
            lasting connections in an increasingly digital world.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  MKing Friend was born from a simple observation: in our hyper-connected
                  world, many people still struggle to find genuine friendships. We saw
                  the need for a platform that goes beyond superficial connections.
                </p>
                <p>
                  Founded in 2024, we&apos;ve been dedicated to creating a space where people
                  can discover others who share their passions, values, and interests.
                  Our algorithm focuses on compatibility and shared experiences rather
                  than just proximity.
                </p>
                <p>
                  Today, we&apos;re proud to have helped thousands of people find their
                  perfect friend match and build communities that matter.
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Team collaboration"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600">
              These principles guide everything we do at MKing Friend.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="flex items-start space-x-4">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600">
              The passionate people behind MKing Friend.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="card p-6 text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-blue-600 font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600 text-sm">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Get in Touch
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Have questions or feedback? We&apos;d love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hello@mkingfriend.com"
              className="btn bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
            >
              Contact Us
            </a>
            <button
              className="btn border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3"
            >
              Join Our Community
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;