import express, { Response } from 'express';
import { prisma } from '../index';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get all conversations for the current user
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: { id: req.user!.id }
      }
    },
    include: {
      members: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isOnline: true,
          lastSeen: true
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      },
      _count: {
        select: {
          messages: {
            where: {
              isDeleted: false
            }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    skip: offset,
    take: Number(limit)
  });

  const totalConversations = await prisma.conversation.count({
    where: {
      members: {
        some: { id: req.user!.id }
      }
    }
  });

  // Format conversations with last message and member info
  const formattedConversations = conversations.map(conversation => ({
    ...conversation,
    lastMessage: conversation.messages[0] || null,
    messageCount: conversation._count.messages,
    otherMembers: conversation.members.filter(member => member.id !== req.user!.id)
  }));

  const totalPages = Math.ceil(totalConversations / Number(limit));

  res.json({
    success: true,
    data: {
      conversations: formattedConversations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalConversations,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    }
  });
}));

// Get specific conversation
router.get('/:conversationId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { conversationId } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      members: {
        some: { id: req.user!.id }
      }
    },
    include: {
      members: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isOnline: true,
          lastSeen: true
        }
      },
      _count: {
        select: {
          messages: {
            where: {
              isDeleted: false
            }
          }
        }
      }
    }
  });

  if (!conversation) {
    throw createError('Conversation not found or unauthorized', 404);
  }

  const formattedConversation = {
    ...conversation,
    messageCount: conversation._count.messages,
    otherMembers: conversation.members.filter(member => member.id !== req.user!.id)
  };

  res.json({
    success: true,
    data: { conversation: formattedConversation }
  });
}));

// Create new conversation (direct message)
router.post('/direct', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    throw createError('User ID is required', 400);
  }

  if (userId === req.user!.id) {
    throw createError('Cannot create conversation with yourself', 400);
  }

  // Check if user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      isOnline: true,
      lastSeen: true
    }
  });

  if (!targetUser) {
    throw createError('User not found', 404);
  }
  // Check if conversation already exists
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        {
          members: {
            some: { id: req.user!.id }
          }
        },
        {
          members: {
            some: { id: userId }
          }
        }
      ]
    },
    include: {
      members: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isOnline: true,
          lastSeen: true
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  if (existingConversation) {
    return res.json({
      success: true,
      data: { 
        conversation: {
          ...existingConversation,
          lastMessage: existingConversation.messages[0] || null,
          otherMembers: existingConversation.members.filter(member => member.id !== req.user!.id)
        }
      },
      message: 'Conversation already exists'
    });
  }
  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        connect: [
          { id: req.user!.id },
          { id: userId }
        ]
      }
    },
    include: {
      members: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isOnline: true,
          lastSeen: true
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  const formattedConversation = {
    ...conversation,
    lastMessage: conversation.messages[0] || null,
    otherMembers: conversation.members.filter(member => member.id !== req.user!.id)
  };

  res.status(201).json({
    success: true,
    data: { conversation: formattedConversation },
    message: 'Conversation created successfully'
  });
}));

// Create group conversation
router.post('/group', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, userIds } = req.body;

  if (!name || !userIds || !Array.isArray(userIds) || userIds.length < 1) {
    throw createError('Group name and at least one user ID are required', 400);
  }

  if (userIds.length > 50) {
    throw createError('Group cannot have more than 50 members', 400);
  }

  // Verify all users exist
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds }
    },
    select: { id: true }
  });

  if (users.length !== userIds.length) {
    throw createError('Some users not found', 400);
  }

  // Create group conversation
  const conversation = await prisma.conversation.create({
    data: {
      name: name.trim(),
      isGroup: true,
      members: {
        connect: [
          { id: req.user!.id },
          ...userIds.map((id: string) => ({ id }))
        ]
      }
    },
    include: {
      members: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isOnline: true,
          lastSeen: true
        }
      }
    }
  });

  // Create system message about group creation
  await prisma.message.create({
    data: {
      content: `${req.user!.username} created the group "${name}"`,
      type: 'SYSTEM',
      senderId: req.user!.id,
      conversationId: conversation.id
    }
  });

  const formattedConversation = {
    ...conversation,
    otherMembers: conversation.members.filter(member => member.id !== req.user!.id)
  };

  res.status(201).json({
    success: true,
    data: { conversation: formattedConversation },
    message: 'Group created successfully'
  });
}));

// Add members to group
router.post('/:conversationId/members', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { conversationId } = req.params;
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw createError('User IDs are required', 400);
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      isGroup: true,
      members: {
        some: { id: req.user!.id }
      }
    },
    include: {
      members: true
    }
  });

  if (!conversation) {
    throw createError('Group conversation not found or unauthorized', 404);
  }

  if (conversation.members.length + userIds.length > 50) {
    throw createError('Group cannot have more than 50 members', 400);
  }

  // Verify users exist and are not already members
  const existingMemberIds = conversation.members.map(m => m.id);
  const newUserIds = userIds.filter((id: string) => !existingMemberIds.includes(id));

  if (newUserIds.length === 0) {
    throw createError('All users are already members of this group', 400);
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: newUserIds }
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true
    }
  });

  if (users.length !== newUserIds.length) {
    throw createError('Some users not found', 400);
  }

  // Add members
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      members: {
        connect: newUserIds.map((id: string) => ({ id }))
      },
      updatedAt: new Date()
    }
  });

  // Create system message
  const userNames = users.map(u => u.displayName || u.username).join(', ');
  await prisma.message.create({
    data: {
      content: `${req.user!.username} added ${userNames} to the group`,
      type: 'SYSTEM',
      senderId: req.user!.id,
      conversationId: conversationId
    }
  });

  res.json({
    success: true,
    message: 'Members added successfully'
  });
}));

// Remove member from group
router.delete('/:conversationId/members/:userId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { conversationId, userId } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      isGroup: true,
      members: {
        some: { id: req.user!.id }
      }
    },
    include: {
      members: true
    }
  });

  if (!conversation) {
    throw createError('Group conversation not found or unauthorized', 404);
  }

  // Check if user is member of the group
  const memberToRemove = conversation.members.find(m => m.id === userId);
  if (!memberToRemove) {
    throw createError('User is not a member of this group', 400);
  }

  // Users can remove themselves, or remove others if they're admin (for now, any member can remove)
  const canRemove = req.user!.id === userId;
  
  if (!canRemove) {
    throw createError('Unauthorized to remove this member', 403);
  }

  // Remove member
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      members: {
        disconnect: { id: userId }
      },
      updatedAt: new Date()
    }
  });

  // Create system message
  const action = req.user!.id === userId ? 'left' : 'was removed from';
  await prisma.message.create({
    data: {
      content: `${memberToRemove.displayName || memberToRemove.username} ${action} the group`,
      type: 'SYSTEM',
      senderId: req.user!.id,
      conversationId: conversationId
    }
  });

  res.json({
    success: true,
    message: 'Member removed successfully'
  });
}));

// Update group info
router.put('/:conversationId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { conversationId } = req.params;
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    throw createError('Group name is required', 400);
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      isGroup: true,
      members: {
        some: { id: req.user!.id }
      }
    }
  });

  if (!conversation) {
    throw createError('Group conversation not found or unauthorized', 404);
  }

  const updatedConversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      name: name.trim(),
      updatedAt: new Date()
    },
    include: {
      members: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isOnline: true,
          lastSeen: true
        }
      }
    }
  });

  // Create system message
  await prisma.message.create({
    data: {
      content: `${req.user!.username} changed the group name to "${name.trim()}"`,
      type: 'SYSTEM',
      senderId: req.user!.id,
      conversationId: conversationId
    }
  });

  res.json({
    success: true,
    data: { conversation: updatedConversation },
    message: 'Group updated successfully'
  });
}));

// Delete conversation (leave group or delete direct conversation)
router.delete('/:conversationId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { conversationId } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      members: {
        some: { id: req.user!.id }
      }
    },
    include: {
      members: true
    }
  });

  if (!conversation) {
    throw createError('Conversation not found or unauthorized', 404);
  }

  if (conversation.isGroup) {
    // Remove user from group
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        members: {
          disconnect: { id: req.user!.id }
        },
        updatedAt: new Date()
      }
    });

    // Create system message
    await prisma.message.create({
      data: {
        content: `${req.user!.username} left the group`,
        type: 'SYSTEM',
        senderId: req.user!.id,
        conversationId: conversationId
      }
    });

    // If no members left, delete the conversation
    const remainingMembers = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { _count: { select: { members: true } } }
    });

    if (remainingMembers && remainingMembers._count.members === 0) {
      await prisma.conversation.delete({
        where: { id: conversationId }
      });
    }
  } else {
    // For direct conversations, just remove the user
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        members: {
          disconnect: { id: req.user!.id }
        }
      }
    });
  }

  res.json({
    success: true,
    message: conversation.isGroup ? 'Left group successfully' : 'Conversation deleted successfully'
  });
}));

export { router as conversationRoutes };
